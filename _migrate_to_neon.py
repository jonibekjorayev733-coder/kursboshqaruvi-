import time
import sqlalchemy as sa
from sqlalchemy import MetaData, Table, text
from collections import defaultdict, deque
from sqlalchemy.exc import OperationalError

SRC_URL = "postgresql://postgres:jonibek@localhost:5432/course"
DST_URL = "postgresql://neondb_owner:npg_rVXN3Hxc4eWg@ep-fragrant-term-a1vlr7lp-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

src_engine = sa.create_engine(SRC_URL, pool_pre_ping=True)
dst_engine = sa.create_engine(
    DST_URL,
    pool_pre_ping=True,
    pool_recycle=120,
    connect_args={
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5,
    },
)

src_meta = MetaData(schema="public")
src_meta.reflect(bind=src_engine)

with dst_engine.begin() as conn:
    conn.execute(text("CREATE SCHEMA IF NOT EXISTS public"))

dst_meta = MetaData(schema="public")
for table in src_meta.sorted_tables:
    table.to_metadata(dst_meta)
dst_meta.create_all(bind=dst_engine, checkfirst=True)

children = defaultdict(set)
in_degree = {t.name: 0 for t in src_meta.tables.values() if t.schema == "public"}
for t in src_meta.tables.values():
    if t.schema != "public":
        continue
    for fk in t.foreign_keys:
        if fk.column.table.schema == "public":
            parent = fk.column.table.name
            child = t.name
            if child not in children[parent]:
                children[parent].add(child)
                in_degree[child] += 1

q = deque(sorted([name for name, deg in in_degree.items() if deg == 0]))
order = []
while q:
    n = q.popleft()
    order.append(n)
    for ch in sorted(children[n]):
        in_degree[ch] -= 1
        if in_degree[ch] == 0:
            q.append(ch)
if len(order) != len(in_degree):
    remaining = [n for n in in_degree.keys() if n not in order]
    order.extend(sorted(remaining))

print("Copy order:", order, flush=True)

for table_name in reversed(order):
    with dst_engine.begin() as conn:
        conn.execute(text(f'TRUNCATE TABLE public."{table_name}" RESTART IDENTITY CASCADE'))

def insert_with_retry(table_obj, chunk_rows, max_retries=5):
    for attempt in range(1, max_retries + 1):
        try:
            with dst_engine.begin() as conn:
                conn.execute(table_obj.insert(), chunk_rows)
            return
        except OperationalError as exc:
            if attempt == max_retries:
                raise
            wait_s = min(2 * attempt, 8)
            print(f"Retry {attempt}/{max_retries} after error: {exc.__class__.__name__}; waiting {wait_s}s", flush=True)
            time.sleep(wait_s)

chunk_size = 500
total_rows = 0

with src_engine.connect() as src_conn:
    for table_name in order:
        src_table = Table(table_name, MetaData(), schema="public", autoload_with=src_engine)
        dst_table = Table(table_name, MetaData(), schema="public", autoload_with=dst_engine)

        rows = src_conn.execute(sa.select(src_table)).mappings().all()
        row_dicts = [dict(r) for r in rows]

        if row_dicts:
            for i in range(0, len(row_dicts), chunk_size):
                chunk = row_dicts[i:i+chunk_size]
                insert_with_retry(dst_table, chunk)

        print(f"{table_name}: {len(row_dicts)} rows copied", flush=True)
        total_rows += len(row_dicts)

print(f"Done. Total rows copied: {total_rows}", flush=True)

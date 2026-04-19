import sqlalchemy as sa
from sqlalchemy import text

SRC_URL = "postgresql://postgres:jonibek@localhost:5432/course"
DST_URL = "postgresql://neondb_owner:npg_rVXN3Hxc4eWg@ep-fragrant-term-a1vlr7lp-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

src_engine = sa.create_engine(SRC_URL)
dst_engine = sa.create_engine(DST_URL)

query_tables = "select tablename from pg_tables where schemaname='public' order by tablename"

with src_engine.connect() as src, dst_engine.connect() as dst:
    src_tables = [r[0] for r in src.execute(text(query_tables))]
    dst_tables = [r[0] for r in dst.execute(text(query_tables))]

    print("SOURCE tables:", src_tables)
    print("NEON tables:  ", dst_tables)
    print("--- row counts ---")

    for t in src_tables:
        src_count = src.execute(text(f'SELECT COUNT(*) FROM public."{t}"')).scalar_one()
        dst_count = dst.execute(text(f'SELECT COUNT(*) FROM public."{t}"')).scalar_one()
        status = "OK" if src_count == dst_count else "MISMATCH"
        print(f"{t:<22} src={src_count:<6} neon={dst_count:<6} {status}")

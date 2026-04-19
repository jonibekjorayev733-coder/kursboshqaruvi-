import sqlalchemy as sa
from sqlalchemy import text

src = "postgresql://postgres:jonibek@localhost:5432/course"
dst = "postgresql://neondb_owner:npg_rVXN3Hxc4eWg@ep-fragrant-term-a1vlr7lp-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

src_engine = sa.create_engine(src)
dst_engine = sa.create_engine(dst)

with src_engine.connect() as c:
    tables = [r[0] for r in c.execute(text("select tablename from pg_tables where schemaname='public' order by tablename"))]
    print("SOURCE tables:", tables)

with dst_engine.connect() as c:
    tables = [r[0] for r in c.execute(text("select tablename from pg_tables where schemaname='public' order by tablename"))]
    print("NEON tables:", tables)

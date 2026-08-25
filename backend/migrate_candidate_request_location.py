from sqlalchemy import text
from database import engine

print("======================================")
print("EVOTE CANDIDATE REQUEST MIGRATION")
print("======================================")

with engine.begin() as connection:
    connection.execute(
        text("""
        ALTER TABLE candidate_requests
        ADD COLUMN IF NOT EXISTS institution_id INTEGER
        """)
    )

    connection.execute(
        text("""
        ALTER TABLE candidate_requests
        ADD COLUMN IF NOT EXISTS organization_id INTEGER
        """)
    )

print("institution_id column ready.")
print("organization_id column ready.")

print("======================================")
print("MIGRATION COMPLETED")
print("======================================")
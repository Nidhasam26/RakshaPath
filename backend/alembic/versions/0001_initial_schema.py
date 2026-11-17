"""Initial RakshaPath Schema with PostGIS Support

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-10-08 17:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
import geoalchemy2

# revision identifiers, used by Alembic.
revision: str = '0001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Ensure PostGIS extension is loaded
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis;")

    # 1. users
    op.create_table(
        'users',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=32), nullable=False),
        sa.Column('push_token', sa.String(length=512), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )
    op.create_index('idx_users_phone', 'users', ['phone'], unique=True)

    # 2. contacts
    op.create_table(
        'contacts',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=32), nullable=False),
        sa.Column('type', sa.String(length=32), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.CheckConstraint("type IN ('family', 'police')", name='check_contact_type'),
    )
    op.create_index('idx_contacts_user_id', 'contacts', ['user_id'])

    # 3. hazards (spatial_index=False so op.create_index manages the GiST index cleanly)
    op.create_table(
        'hazards',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('type', sa.String(length=64), nullable=False),
        sa.Column('geometry', geoalchemy2.Geometry(geometry_type='GEOMETRY', srid=4326, spatial_index=False), nullable=False),
        sa.Column('severity', sa.Integer(), nullable=False),
        sa.Column('confidence', sa.Float(), nullable=False),
        sa.Column('source', sa.String(length=64), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('archived_at', sa.DateTime(), nullable=True),
        sa.CheckConstraint('severity >= 1 AND severity <= 4', name='check_hazard_severity_range'),
        sa.CheckConstraint('confidence >= 0.0 AND confidence <= 1.0', name='check_hazard_confidence_range'),
    )
    op.create_index('idx_hazards_geometry', 'hazards', ['geometry'], postgresql_using='gist')
    op.create_index('idx_hazards_type', 'hazards', ['type'])
    op.create_index('idx_hazards_expires_at', 'hazards', ['expires_at'])
    op.create_index('idx_hazards_archived_at', 'hazards', ['archived_at'])

    # 4. hazard_sources_log
    op.create_table(
        'hazard_sources_log',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('source', sa.String(length=64), nullable=False),
        sa.Column('fetched_at', sa.DateTime(), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('records_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('error', sa.Text(), nullable=True),
    )

    # 5. trips (spatial_index=False so op.create_index manages the GiST index cleanly)
    op.create_table(
        'trips',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('route', geoalchemy2.Geometry(geometry_type='LINESTRING', srid=4326, spatial_index=False), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='active'),
        sa.Column('started_at', sa.DateTime(), nullable=False),
        sa.Column('ended_at', sa.DateTime(), nullable=True),
        sa.Column('last_seen_at', sa.DateTime(), nullable=False),
        sa.Column('last_lat', sa.Float(), nullable=True),
        sa.Column('last_lng', sa.Float(), nullable=True),
        sa.CheckConstraint("status IN ('active', 'completed', 'cancelled')", name='check_trip_status'),
    )
    op.create_index('idx_trips_route', 'trips', ['route'], postgresql_using='gist')
    op.create_index('idx_trips_user_id', 'trips', ['user_id'])
    op.create_index('idx_trips_status', 'trips', ['status'])

    # 6. trip_locations
    op.create_table(
        'trip_locations',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('trip_id', UUID(as_uuid=True), sa.ForeignKey('trips.id', ondelete='CASCADE'), nullable=False),
        sa.Column('lat', sa.Float(), nullable=False),
        sa.Column('lng', sa.Float(), nullable=False),
        sa.Column('speed_mps', sa.Float(), nullable=True),
        sa.Column('recorded_at', sa.DateTime(), nullable=False),
    )
    op.create_index('idx_trip_locations_trip_id', 'trip_locations', ['trip_id'])
    op.create_index('idx_trip_locations_recorded_at', 'trip_locations', ['recorded_at'])

    # 7. sos_alerts
    op.create_table(
        'sos_alerts',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('trip_id', UUID(as_uuid=True), sa.ForeignKey('trips.id', ondelete='SET NULL'), nullable=True),
        sa.Column('lat', sa.Float(), nullable=False),
        sa.Column('lng', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('channel', sa.String(length=32), nullable=False, server_default='online'),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='new'),
        sa.Column('acknowledged_by', sa.String(length=255), nullable=True),
        sa.Column('closed_at', sa.DateTime(), nullable=True),
        sa.Column('note', sa.Text(), nullable=True),
        sa.CheckConstraint("channel IN ('online', 'sms')", name='check_sos_channel'),
        sa.CheckConstraint("status IN ('new', 'acknowledged', 'closed')", name='check_sos_status'),
    )
    op.create_index('idx_sos_alerts_user_id', 'sos_alerts', ['user_id'])
    op.create_index('idx_sos_alerts_trip_id', 'sos_alerts', ['trip_id'])
    op.create_index('idx_sos_alerts_created_at', 'sos_alerts', ['created_at'])
    op.create_index('idx_sos_alerts_status', 'sos_alerts', ['status'])

    # 8. notifications_sent
    op.create_table(
        'notifications_sent',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('trip_id', UUID(as_uuid=True), sa.ForeignKey('trips.id', ondelete='CASCADE'), nullable=False),
        sa.Column('hazard_id', sa.String(length=64), sa.ForeignKey('hazards.id', ondelete='CASCADE'), nullable=False),
        sa.Column('channel', sa.String(length=32), nullable=False, server_default='push'),
        sa.Column('sent_at', sa.DateTime(), nullable=False),
        sa.Column('delivered', sa.Boolean(), nullable=False, server_default=sa.text('false')),
    )
    op.create_index('idx_notifications_sent_trip_id', 'notifications_sent', ['trip_id'])
    op.create_index('idx_notifications_sent_hazard_id', 'notifications_sent', ['hazard_id'])

    # 9. operators
    op.create_table(
        'operators',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=64), nullable=False, server_default='operator'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )
    op.create_index('idx_operators_email', 'operators', ['email'], unique=True)

    # 10. segment_risk (spatial_index=False so op.create_index manages the GiST index cleanly)
    op.create_table(
        'segment_risk',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('segment_id', sa.String(length=128), nullable=False),
        sa.Column('geometry', geoalchemy2.Geometry(geometry_type='GEOMETRY', srid=4326, spatial_index=False), nullable=False),
        sa.Column('risk_score', sa.Float(), nullable=False),
        sa.Column('model_version', sa.String(length=64), nullable=False),
        sa.Column('computed_at', sa.DateTime(), nullable=False),
    )
    op.create_index('idx_segment_risk_geometry', 'segment_risk', ['geometry'], postgresql_using='gist')
    op.create_index('idx_segment_risk_segment_id', 'segment_risk', ['segment_id'], unique=True)


def downgrade() -> None:
    op.drop_table('segment_risk')
    op.drop_table('operators')
    op.drop_table('notifications_sent')
    op.drop_table('sos_alerts')
    op.drop_table('trip_locations')
    op.drop_table('trips')
    op.drop_table('hazard_sources_log')
    op.drop_table('hazards')
    op.drop_table('contacts')
    op.drop_table('users')

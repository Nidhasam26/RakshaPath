import pytest
from datetime import datetime, timedelta
from sqlalchemy import text
from shapely.geometry import Point, Polygon, LineString
from geoalchemy2.shape import from_shape

from app.db.session import SessionLocal, engine
from app.models.user import User, Contact
from app.models.hazard import Hazard
from app.models.trip import Trip
from app.models.operator import Operator
from app.db.seed import seed_hazards


def test_postgis_extension_enabled(db):

    """Verify PostGIS extension is loaded in the PostgreSQL database."""
    result = db.execute(text("SELECT PostGIS_Version();")).scalar()
    assert result is not None
    assert len(result) > 0


def test_idempotent_seed_hazards(db):
    """Verify seed script runs twice without duplicating or failing."""
    count_1 = seed_hazards(db)
    assert count_1 == 5

    count_2 = seed_hazards(db)
    assert count_2 == 5

    total_hazards = db.query(Hazard).count()
    assert total_hazards == 5

    # Check that demo operator was also created
    op = db.query(Operator).filter(Operator.email == "operator@rakshapath.gov.in").first()
    assert op is not None
    assert op.role == "operator"


def test_user_and_contact_constraints(db):
    """Verify contact type constraint ('family', 'police')."""
    user = User(
        name="Test Driver",
        phone="+919999911111",
        push_token="test_fcm_token",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    contact_fam = Contact(
        user_id=user.id,
        name="Parent",
        phone="+919999922222",
        type="family",
    )
    contact_pol = Contact(
        user_id=user.id,
        name="Local Station",
        phone="112",
        type="police",
    )
    db.add_all([contact_fam, contact_pol])
    db.commit()

    # Invalid contact type should raise CheckConstraint violation
    invalid_contact = Contact(
        user_id=user.id,
        name="Invalid",
        phone="+919999933333",
        type="invalid_type",
    )
    db.add(invalid_contact)
    with pytest.raises(Exception):
        db.commit()
    db.rollback()

    # Clean up test user
    db.delete(user)
    db.commit()


def test_hazard_severity_and_confidence_constraints(db):
    """Verify hazard severity (1..4) and confidence (0.0..1.0) constraints."""
    pt = from_shape(Point(77.60, 12.90), srid=4326)

    # Valid hazard
    valid_hazard = Hazard(
        id="haz-valid-test",
        type="flood",
        geometry=pt,
        severity=3,
        confidence=0.85,
        source="test",
        expires_at=datetime.utcnow() + timedelta(hours=2),
    )
    db.add(valid_hazard)
    db.commit()

    # Invalid severity > 4
    inv_sev = Hazard(
        id="haz-invalid-sev",
        type="flood",
        geometry=pt,
        severity=5,
        confidence=0.85,
        source="test",
        expires_at=datetime.utcnow() + timedelta(hours=2),
    )
    db.add(inv_sev)
    with pytest.raises(Exception):
        db.commit()
    db.rollback()

    # Invalid confidence > 1.0
    inv_conf = Hazard(
        id="haz-invalid-conf",
        type="flood",
        geometry=pt,
        severity=2,
        confidence=1.5,
        source="test",
        expires_at=datetime.utcnow() + timedelta(hours=2),
    )
    db.add(inv_conf)
    with pytest.raises(Exception):
        db.commit()
    db.rollback()

    # Clean up
    db.delete(valid_hazard)
    db.commit()


def test_spatial_query_stdwithin_200m_vs_1km(db):
    """
    Test PostGIS spatial queries:
    1. Create a route Linestring from (77.6000, 12.9000) to (77.6200, 12.9000).
    2. Place Hazard A at (77.6100, 12.9005) -> ~55 meters away from the route (within 200m).
    3. Place Hazard B at (77.6100, 12.9100) -> ~1.1 km away from the route (outside 200m).
    4. Insert a Polygon Hazard C encompassing (77.6150, 12.8950) to (77.6250, 12.9050) -> intersects the route.
    5. Prove ST_DWithin(geometry::geography, ..., 200) captures Hazard A & C, and strictly excludes Hazard B.
    """
    # 1. Clean previous test hazards if any
    db.query(Hazard).filter(Hazard.id.in_(["haz-close", "haz-far", "haz-polygon"])).delete()
    db.commit()

    # Linestring along latitude 12.9000 from 77.6000 to 77.6200
    route_geom = LineString([(77.6000, 12.9000), (77.6200, 12.9000)])

    # Hazard A: ~55m North of the route
    pt_near = Point(77.6100, 12.9005)
    # Hazard B: ~1100m North of the route
    pt_far = Point(77.6100, 12.9100)
    # Hazard C: Polygon zone overlapping route end
    poly_zone = Polygon([
        (77.6150, 12.8950),
        (77.6250, 12.8950),
        (77.6250, 12.9050),
        (77.6150, 12.9050),
        (77.6150, 12.8950)
    ])

    haz_a = Hazard(
        id="haz-close",
        type="fallen_tree",
        geometry=from_shape(pt_near, srid=4326),
        severity=4,
        confidence=0.9,
        source="test",
        expires_at=datetime.utcnow() + timedelta(hours=1),
    )
    haz_b = Hazard(
        id="haz-far",
        type="water_logging",
        geometry=from_shape(pt_far, srid=4326),
        severity=2,
        confidence=0.8,
        source="test",
        expires_at=datetime.utcnow() + timedelta(hours=1),
    )
    haz_c = Hazard(
        id="haz-polygon",
        type="cyclone_zone",
        geometry=from_shape(poly_zone, srid=4326),
        severity=3,
        confidence=0.95,
        source="test",
        expires_at=datetime.utcnow() + timedelta(hours=1),
    )
    db.add_all([haz_a, haz_b, haz_c])
    db.commit()

    # Query with ST_DWithin on geography (200 meters buffer)
    query = text("""
        SELECT id, ST_Distance(geometry::geography, ST_GeomFromText(:route_wkt, 4326)::geography) AS distance_meters
        FROM hazards
        WHERE ST_DWithin(geometry::geography, ST_GeomFromText(:route_wkt, 4326)::geography, 200)
        ORDER BY distance_meters ASC;
    """)

    results = db.execute(query, {"route_wkt": route_geom.wkt}).fetchall()
    matched_ids = [row[0] for row in results]

    # Verify Hazard A (near) and Hazard C (polygon) are matched within 200m
    assert "haz-close" in matched_ids
    assert "haz-polygon" in matched_ids

    # Verify Hazard B (1.1 km away) is NOT matched
    assert "haz-far" not in matched_ids

    # Clean up test hazards
    db.query(Hazard).filter(Hazard.id.in_(["haz-close", "haz-far", "haz-polygon"])).delete()
    db.commit()

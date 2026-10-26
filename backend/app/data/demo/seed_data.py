import json
import uuid
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.field import Field, Observation
from app.models.chat import ChatSession, ChatMessage

def seed_demo_database(db: Session):
    """Seed realistic initial demonstration data for hackathon judges if database is fresh."""
    existing_fields = db.query(Field).filter(Field.is_demo.is_(True)).count()
    if existing_fields > 0:
        return  # Already seeded or user has saved data

    # 1. Create realistic Maharashtra demo fields
    field1 = Field(
        is_demo=True,
        name="गट क्र. ४२ (Gat No. 42 - Main Plot)",
        location="Baramati, Pune District, Maharashtra",
        crop="Soybean (सोयाबीन - JS 335)",
        planting_date=(datetime.utcnow() - timedelta(days=45)).strftime("%Y-%m-%d"),
        area=3.5,
        area_unit="Acres",
        growth_stage="Flowering & Pod Initiation",
        notes="Irrigated via drip lines. Sown after first pre-monsoon showers. Intercropped with Pigeon Pea."
    )
    field2 = Field(
        is_demo=True,
        name="नदीकाठ रान (Riverbank Sugarcane Plot)",
        location="Phaltan, Satara District, Maharashtra",
        crop="Sugarcane (ऊस - Co 86032)",
        planting_date=(datetime.utcnow() - timedelta(days=120)).strftime("%Y-%m-%d"),
        area=2.0,
        area_unit="Acres",
        growth_stage="Grand Growth & Tillering",
        notes="Flood irrigated from well. Regular vermicompost application carried out."
    )
    field3 = Field(
        is_demo=True,
        name="उत्तर डाळिंब बाग (North Orchard)",
        location="Pandharpur, Solapur District, Maharashtra",
        crop="Pomegranate (डाळिंब - Bhagwa)",
        planting_date=(datetime.utcnow() - timedelta(days=500)).strftime("%Y-%m-%d"),
        area=1.5,
        area_unit="Acres",
        growth_stage="Fruit Development & Sizing",
        notes="Pruned 70 days ago for Mrig Bahar. Drip fertigation scheduled weekly."
    )

    db.add_all([field1, field2, field3])
    db.commit()
    db.refresh(field1)
    db.refresh(field2)
    db.refresh(field3)

    # 2. Add realistic observations
    obs1 = Observation(
        field_id=field1.id,
        date=(datetime.utcnow() - timedelta(days=3)).strftime("%Y-%m-%d"),
        growth_stage="Flowering",
        notes="Observed light yellowing on lower leaves in the north-east corner. Installed 6 yellow sticky traps. Soil moisture is adequate.",
        photo_url=None
    )
    obs2 = Observation(
        field_id=field1.id,
        date=(datetime.utcnow() - timedelta(days=14)).strftime("%Y-%m-%d"),
        growth_stage="Vegetative",
        notes="First weeding completed manually. Micronutrient spray (19:19:19) administered as per MPKV recommendation.",
        photo_url=None
    )
    obs3 = Observation(
        field_id=field2.id,
        date=(datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%d"),
        growth_stage="Tillering",
        notes="Earthing up (माती लावणे) completed across all rows. Good vigor and healthy green leaf canopy.",
        photo_url=None
    )

    db.add_all([obs1, obs2, obs3])

    # 3. Add realistic demo conversation session
    demo_session_id = "demo-session-baramati-01"
    session = db.query(ChatSession).filter(ChatSession.id == demo_session_id).first()
    if session is None or session.owner_id is not None or not session.is_demo:
        demo_session_id = f"demo-session-{uuid.uuid4().hex}"
        session = ChatSession(
            id=demo_session_id,
            title="सोयाबीन पिवळे पडणे व उपाय (Soybean Yellowing Advice)",
            language="mr",
            is_demo=True,
        )
        db.add(session)
        db.commit()

    existing_messages = db.query(ChatMessage).filter(ChatMessage.session_id == demo_session_id).count()
    if existing_messages:
        return

    user_msg = ChatMessage(
        session_id=demo_session_id,
        sender="user",
        content="माझ्या सोयाबीनच्या पानांवर पिवळे चट्टे दिसत आहेत आणि झाडांची वाढ खुंटली आहे. काय करावे?",
        language="mr",
        is_demo=True,
        created_at=datetime.utcnow() - timedelta(minutes=15)
    )

    assistant_msg = ChatMessage(
        session_id=demo_session_id,
        sender="assistant",
        content="पानांवरील वर्णन केलेली लक्षणे पिवळा मोझॅक किंवा पांढऱ्या माशीच्या प्रादुर्भावाशी मिळती-जुळती असू शकतात; हा प्राथमिक अंदाज आहे, खात्रीशीर निदान नाही. दिलेल्या संदर्भांतील अद्ययावत शिफारसी येथे तपासलेल्या नाहीत.",
        language="mr",
        is_demo=True,
        sources_json=json.dumps([
            {
                "title": "ICAR-Indian Institute of Soybean Research Advisory Bulletin",
                "organization": "ICAR-IISR Indore",
                "url": "https://iisrindore.icar.gov.in",
                "note": "Official organization portal; current advice has not been checked here."
            },
            {
                "title": "VNMKV Kharif Crop Advisory",
                "organization": "VNMKV Parbhani",
                "url": "https://www.vnmkv.ac.in",
                "note": "Official organization portal; current advice has not been checked here."
            }
        ], ensure_ascii=False),
        structured_json=json.dumps({
            "what_might_be_happening": "लक्षणे पिवळ्या मोझॅकशी मिळती-जुळती असू शकतात; प्रत्यक्ष शेत तपासणीशिवाय रोगाची खात्री करता येत नाही.",
            "what_to_do_now": [
              "पानांच्या खालच्या बाजूला पांढरी माशी आहे का ते तपासा आणि दिसल्यास नोंद ठेवा.",
              "पिवळे चिकट सापळे वापरण्यापूर्वी स्थानिक कृषी तज्ज्ञांकडून योग्य प्रकार व मांडणी विचारा.",
              "कोणतीही फवारणी करण्यापूर्वी पिकासाठी सध्याची शिफारस, नोंदणी आणि उत्पादनाचे लेबल तपासा."
            ],
            "what_to_monitor": [
              "पानांच्या खालच्या बाजूला पांढऱ्या माशीची उपस्थिती आणि संख्या वाढते आहे का ते पहा.",
              "पिवळेपणा शेजारच्या झाडांमध्ये पसरतो आहे का ते तपासा."
            ],
            "when_to_consult_expert": "लक्षणे वाढत असल्यास किंवा फवारणीचा विचार करत असल्यास, आपल्या तालुका कृषी अधिकारी (TAO) किंवा नजीकच्या कृषी विज्ञान केंद्राशी (KVK) संपर्क साधा."
        }, ensure_ascii=False),
        created_at=datetime.utcnow() - timedelta(minutes=14)
    )

    db.add_all([user_msg, assistant_msg])
    db.commit()

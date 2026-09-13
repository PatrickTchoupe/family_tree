from sqlmodel import Session, text
from app.database import engine

def test_connection():
    try:
        with Session(engine) as session:
            result = session.exec(text("SELECT version();"))
            version = result.first()
            print("✅ Connexion réussie !")
            print(f"Version PostgreSQL : {version[0]}")
    except Exception as e:
        print("❌ Échec de la connexion")
        print(f"Erreur : {e}")

if __name__ == "__main__":
    test_connection()
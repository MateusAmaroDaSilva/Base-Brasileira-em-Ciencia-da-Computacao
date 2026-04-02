from app.core.database import engine, Base, SessionLocal
from app.core.database import Magazine
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def init_db():
    logger.info("Criando tabelas...")
    Base.metadata.create_all(bind=engine)
    logger.info("Tabelas criadas com sucesso!")
    
    db = SessionLocal()
    try:
        magazines_count = db.query(Magazine).count()
        
        if magazines_count == 0:
            logger.info("Adicionando revistas iniciais...")
            
            magazines = [
                {
                    "name": "RBIE",
                    "url_oai_pmh": "https://journals-sol.sbc.org.br/index.php/rbie/oai",
                    "description": "Revista Brasileira de Informática na Educação"
                },
                {
                    "name": "Reviews",
                    "url_oai_pmh": "https://journals-sol.sbc.org.br/index.php/reviews/oai",
                    "description": "Reviews em Engenharia de Software"
                },
                {
                    "name": "ISYS",
                    "url_oai_pmh": "https://journals-sol.sbc.org.br/index.php/isys/oai",
                    "description": "ISYS - Revista Brasileira de Sistemas de Informação"
                },
                {
                    "name": "RITA",
                    "url_oai_pmh": "https://seer.ufrgs.br/index.php/rita/oai",
                    "description": "RITA - Revista de Informática Teórica e Aplicada"
                },
                {
                    "name": "Ciência & Inovação",
                    "url_oai_pmh": "https://periodicos.iffarroupilha.edu.br/index.php/cienciainovacao/oai",
                    "description": "Revista Ciência & Inovação"
                }
            ]
            
            for mag_data in magazines:
                magazine = Magazine(**mag_data)
                db.add(magazine)
            
            db.commit()
            logger.info(f" {len(magazines)} revistas adicionadas com sucesso!")
        else:
            logger.info(f"Banco já possui {magazines_count} revistas")
    
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
    logger.info("Iniciação do banco de dados concluída!")

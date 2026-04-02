import sys
from app.extractors.oai_pmh import OAIPMHExtractor
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def test_magazine(magazine_url: str, magazine_name: str):
    logger.info(f"\n{'='*60}")
    logger.info(f"Testando: {magazine_name}")
    logger.info(f"URL: {magazine_url}")
    logger.info(f"{'='*60}\n")
    
    try:
        extractor = OAIPMHExtractor(magazine_url)
        
        # Validar repositório
        logger.info("1. Validando repositório...")
        if not extractor.validate_repository():
            logger.error(" Repositório não responde ou formato inválido")
            return False
        
        logger.info(" Repositório validado com sucesso")
        
        # Buscar artigos
        logger.info("\n2. Buscando artigos...")
        new_articles, updated_articles, errors = extractor.fetch_articles()
        
        logger.info(f" Extração completa!")
        logger.info(f"   - Artigos novos: {len(new_articles)}")
        logger.info(f"   - Artigos atualizados: {len(updated_articles)}")
        logger.info(f"   - Erros: {len(errors)}")
        
        # Mostrar amostra
        if new_articles:
            logger.info("\n3. Amostra de artigos:")
            for i, article in enumerate(new_articles[:2], 1):
                logger.info(f"\n   Artigo {i}:")
                logger.info(f"   - Título: {article.get('title', 'N/A')[:60]}")
                logger.info(f"   - Autores: {', '.join(article.get('authors', [])[:2])}")
                logger.info(f"   - Data: {article.get('publication_date', 'N/A')}")
        
        if errors:
            logger.warning(f"\n  Erros encontrados:")
            for error in errors[:3]:
                logger.warning(f"   - {error}")
        
        return True
    
    except Exception as e:
        logger.error(f" Erro na extração: {e}")
        return False


def main():
    # Testa todas as revistas
    magazines = [
        ("https://journals-sol.sbc.org.br/index.php/rbie/oai", "RBIE"),
        ("https://journals-sol.sbc.org.br/index.php/reviews/oai", "Reviews"),
        ("https://journals-sol.sbc.org.br/index.php/isys/oai", "ISYS"),
        ("https://seer.ufrgs.br/index.php/rita/oai", "RITA"),
        ("https://periodicos.iffarroupilha.edu.br/index.php/cienciainovacao/oai", "Ciência & Inovação"),
    ]
    
    results = {}
    
    for url, name in magazines:
        try:
            results[name] = test_magazine(url, name)
        except Exception as e:
            logger.error(f"Erro ao testar {name}: {e}")
            results[name] = False
    
    # Resumo
    logger.info(f"\n{'='*60}")
    logger.info("RESUMO DOS TESTES")
    logger.info(f"{'='*60}")
    
    success_count = sum(1 for v in results.values() if v)
    
    for magazine, success in results.items():
        status = " OK" if success else " FALHOU"
        logger.info(f"{status} - {magazine}")
    
    logger.info(f"\nTotal: {success_count}/{len(results)} sucesso")
    
    return 0 if success_count == len(results) else 1


if __name__ == "__main__":
    sys.exit(main())

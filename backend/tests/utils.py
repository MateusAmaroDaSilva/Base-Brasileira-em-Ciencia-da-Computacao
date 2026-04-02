import json
import time
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta


class TestDataBuilder:

    @staticmethod
    def build_article(
        title: str = "Test Article",
        magazine_id: int = 1,
        **kwargs
    ) -> Dict[str, Any]:
        article = {
            "id": kwargs.get("id", 1),
            "title": title,
            "abstract": kwargs.get("abstract", "Test abstract"),
            "authors": kwargs.get("authors", ["Author 1"]),
            "keywords": kwargs.get("keywords", ["test", "article"]),
            "publication_date": kwargs.get("publication_date", "2026-01-01"),
            "magazine_id": magazine_id,
            "oai_identifier": kwargs.get("oai_identifier", f"oai:test:{kwargs.get('id', 1)}"),
            "url": kwargs.get("url", f"http://example.com/article/{kwargs.get('id', 1)}"),
            "created_at": kwargs.get("created_at", datetime.now().isoformat()),
            "updated_at": kwargs.get("updated_at", datetime.now().isoformat()),
        }
        return article

    @staticmethod
    def build_magazine(
        name: str = "Test Magazine",
        **kwargs
    ) -> Dict[str, Any]:
        magazine = {
            "id": kwargs.get("id", 1),
            "name": name,
            "url": kwargs.get("url", f"http://example.com/oai"),
            "description": kwargs.get("description", f"A test magazine: {name}"),
            "active": kwargs.get("active", True),
            "created_at": kwargs.get("created_at", datetime.now().isoformat()),
            "updated_at": kwargs.get("updated_at", datetime.now().isoformat()),
        }
        return magazine

    @staticmethod
    def build_search_query(
        query: str = "test",
        **kwargs
    ) -> Dict[str, Any]:
        return {
            "query": query,
            "limit": kwargs.get("limit", 10),
            "offset": kwargs.get("offset", 0),
            "magazine_id": kwargs.get("magazine_id", None),
        }

    @staticmethod
    def build_articles(count: int = 5) -> List[Dict[str, Any]]:
        return [
            TestDataBuilder.build_article(
                title=f"Article {i}",
                id=i,
                oai_identifier=f"oai:test:{i}"
            )
            for i in range(1, count + 1)
        ]


class TestAssertions:

    @staticmethod
    def assert_valid_article(article: Dict[str, Any]):
        required_fields = [
            "id", "title", "abstract", "magazine_id", "oai_identifier"
        ]
        for field in required_fields:
            assert field in article, f"Article missing field: {field}"
        
        # Validate types
        assert isinstance(article["id"], int)
        assert isinstance(article["title"], str)
        assert len(article["title"]) > 0

    @staticmethod
    def assert_valid_search_response(response: Dict[str, Any]):
        assert "total" in response or "articles" in response
        
        if "articles" in response:
            assert isinstance(response["articles"], list)

    @staticmethod
    def assert_valid_error_response(response: Dict[str, Any], expected_code: Optional[str] = None):
        assert "detail" in response or "error" in response or "message" in response

    @staticmethod
    def assert_elasticsearch_document(doc: Dict[str, Any]):
        required_fields = ["title", "abstract", "publication_date"]
        for field in required_fields:
            assert field in doc, f"ES doc missing field: {field}"


class PerformanceHelper:

    def __init__(self, name: str = "Operation"):
        self.name = name
        self.start_time = None
        self.end_time = None

    def __enter__(self):
        self.start_time = time.time()
        return self

    def __exit__(self, *args):
        self.end_time = time.time()

    @property
    def elapsed(self) -> float:
        if self.start_time and self.end_time:
            return self.end_time - self.start_time
        return 0.0

    def print_result(self):
        print(f"{self.name}: {self.elapsed:.3f}s")

    def assert_under(self, max_seconds: float):
        assert self.elapsed < max_seconds, \
            f"{self.name} took {self.elapsed:.3f}s (max: {max_seconds}s)"


class MockDataGenerator:

    @staticmethod
    def generate_oai_response(
        count: int = 10,
        magazine_id: int = 1
    ) -> Dict[str, Any]:
        articles = [
            {
                "title": f"Article {i}: Machine Learning in Education",
                "abstract": f"A comprehensive study on applying ML techniques #{i}",
                "authors": [f"Author {j}" for j in range(1, (i % 3) + 2)],
                "keywords": ["machine learning", "education", "AI", "technology"],
                "publication_date": (
                    datetime.now() - timedelta(days=i)
                ).strftime("%Y-%m-%d"),
                "oai_identifier": f"oai:magazine:{magazine_id}:{i}",
            }
            for i in range(count)
        ]
        
        return {
            "articles": articles,
            "resumption_token": None,
            "total": count,
        }

    @staticmethod
    def generate_elasticsearch_response(
        count: int = 5,
        query: str = "test"
    ) -> Dict[str, Any]:
        hits = [
            {
                "_id": str(i),
                "_score": 1.0 - (i * 0.1),
                "_source": {
                    "id": i,
                    "title": f"Result {i}: {query} in Computing",
                    "abstract": f"Article about {query}",
                    "magazine_id": 1,
                    "authors": ["Author 1"],
                }
            }
            for i in range(count)
        ]
        
        return {
            "hits": {
                "total": {"value": count},
                "hits": hits
            }
        }


class RequestHelper:

    @staticmethod
    def build_search_request(
        query: str,
        magazine_id: Optional[int] = None,
        limit: int = 10,
    ) -> Dict[str, Any]:
        req = {
            "query": query,
            "limit": limit,
        }
        if magazine_id is not None:
            req["magazine_id"] = magazine_id
        return req

    @staticmethod
    def build_create_magazine_request(
        name: str,
        url: str,
        **kwargs
    ) -> Dict[str, Any]:
        return {
            "name": name,
            "url": url,
            "description": kwargs.get("description", f"Magazine: {name}"),
            "active": kwargs.get("active", True),
        }


class JSONHelper:

    @staticmethod
    def assert_valid_json(data: str) -> Dict:
        try:
            return json.loads(data)
        except json.JSONDecodeError as e:
            raise AssertionError(f"Invalid JSON: {e}")

    @staticmethod
    def deep_compare(obj1: Any, obj2: Any, ignore_fields: List[str] = None) -> bool:
        ignore_fields = ignore_fields or ["created_at", "updated_at"]
        
        if isinstance(obj1, dict) and isinstance(obj2, dict):
            keys1 = {k for k in obj1.keys() if k not in ignore_fields}
            keys2 = {k for k in obj2.keys() if k not in ignore_fields}
            
            if keys1 != keys2:
                return False
            
            for key in keys1:
                if not JSONHelper.deep_compare(obj1[key], obj2[key], ignore_fields):
                    return False
            return True
        
        elif isinstance(obj1, list) and isinstance(obj2, list):
            if len(obj1) != len(obj2):
                return False
            return all(
                JSONHelper.deep_compare(a, b, ignore_fields)
                for a, b in zip(obj1, obj2)
            )
        
        else:
            return obj1 == obj2


def track_test_execution(func):
    def wrapper(*args, **kwargs):
        test_name = func.__name__
        print(f"\n  Running: {test_name}")
        
        try:
            with PerformanceHelper(test_name) as timer:
                result = func(*args, **kwargs)
            timer.print_result()
            print(f" Passed: {test_name}")
            return result
        except Exception as e:
            print(f" Failed: {test_name}")
            raise
    
    return wrapper

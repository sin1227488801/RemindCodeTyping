"""System problems service implementation."""

from typing import List, Dict, Optional
from abc import ABC, abstractmethod
from domain.system_problems import SystemProblem, DifficultyLevel


class SystemProblemsService(ABC):
    """Abstract base class for system problems service."""

    @abstractmethod
    async def get_problems_by_language(self, language: str) -> List[SystemProblem]:
        """Get system problems for a specific language."""
        pass

    @abstractmethod
    async def get_available_languages(self) -> List[str]:
        """Get list of available programming languages."""
        pass

    def normalize_language(self, language: str) -> str:
        """Normalize language name to lowercase for case-insensitive matching."""
        return language.lower().strip()


def create_default_problems_data() -> Dict[str, List[SystemProblem]]:
    """Create default system problems data for all supported languages.
    
    Centralized data creation to avoid duplication across service implementations.
    """
    return {
        "html": [
            SystemProblem(
                question="<!DOCTYPE html>",
                answer="<!DOCTYPE html>",
                difficulty=DifficultyLevel.BEGINNER,
                category="doctype"
            ),
            SystemProblem(
                question="<html lang='ja'>",
                answer="<html lang='ja'>",
                difficulty=DifficultyLevel.BEGINNER,
                category="attributes"
            ),
            SystemProblem(
                question="<meta charset='UTF-8'>",
                answer="<meta charset='UTF-8'>",
                difficulty=DifficultyLevel.BEGINNER,
                category="meta"
            ),
        ],
        "css": [
            SystemProblem(
                question="* { box-sizing: border-box; }",
                answer="* { box-sizing: border-box; }",
                difficulty=DifficultyLevel.INTERMEDIATE,
                category="universal"
            ),
            SystemProblem(
                question=".container { max-width: 1200px; margin: 0 auto; }",
                answer=".container { max-width: 1200px; margin: 0 auto; }",
                difficulty=DifficultyLevel.BEGINNER,
                category="layout"
            ),
        ],
        "javascript": [
            SystemProblem(
                question="const arr = [1, 2, 3, 4, 5];",
                answer="const arr = [1, 2, 3, 4, 5];",
                difficulty=DifficultyLevel.BEGINNER,
                category="arrays"
            ),
            SystemProblem(
                question="arr.map(x => x * 2)",
                answer="arr.map(x => x * 2)",
                difficulty=DifficultyLevel.INTERMEDIATE,
                category="methods"
            ),
            SystemProblem(
                question="function calculateSum(a, b) { return a + b; }",
                answer="function calculateSum(a, b) { return a + b; }",
                difficulty=DifficultyLevel.BEGINNER,
                category="functions"
            ),
        ],
        "php": [
            SystemProblem(
                question="<?php echo 'Hello World'; ?>",
                answer="<?php echo 'Hello World'; ?>",
                difficulty=DifficultyLevel.BEGINNER,
                category="basics"
            ),
        ],
        "java": [
            SystemProblem(
                question="public class Main { public static void main(String[] args) {",
                answer="public class Main { public static void main(String[] args) {",
                difficulty=DifficultyLevel.BEGINNER,
                category="class"
            ),
        ],
        "python3": [
            SystemProblem(
                question="def calculate_sum(a, b): return a + b",
                answer="def calculate_sum(a, b): return a + b",
                difficulty=DifficultyLevel.BEGINNER,
                category="functions"
            ),
        ],
        "sql": [
            SystemProblem(
                question="SELECT * FROM users WHERE age > 18;",
                answer="SELECT * FROM users WHERE age > 18;",
                difficulty=DifficultyLevel.BEGINNER,
                category="queries"
            ),
            SystemProblem(
                question="CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(100));",
                answer="CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(100));",
                difficulty=DifficultyLevel.INTERMEDIATE,
                category="ddl"
            ),
        ],
        "linux (red hat)": [
            SystemProblem(
                question="sudo yum install nginx",
                answer="sudo yum install nginx",
                difficulty=DifficultyLevel.BEGINNER,
                category="package"
            ),
        ],
        "linux(debian)": [
            SystemProblem(
                question="sudo apt-get update && sudo apt-get install nginx",
                answer="sudo apt-get update && sudo apt-get install nginx",
                difficulty=DifficultyLevel.BEGINNER,
                category="package"
            ),
        ],
        "git": [
            SystemProblem(
                question="git add . && git commit -m 'Initial commit'",
                answer="git add . && git commit -m 'Initial commit'",
                difficulty=DifficultyLevel.BEGINNER,
                category="basics"
            ),
        ],
    }


class DefaultSystemProblemsService(SystemProblemsService):
    """Default implementation with predefined system problems."""

    def __init__(self):
        """Initialize service with default problems data."""
        self._problems_data: Optional[Dict[str, List[SystemProblem]]] = None

    async def get_problems_by_language(self, language: str) -> List[SystemProblem]:
        """Get problems for specific language."""
        if self._problems_data is None:
            self._problems_data = create_default_problems_data()
        
        normalized_lang = self.normalize_language(language)
        return self._problems_data.get(normalized_lang, [])

    async def get_available_languages(self) -> List[str]:
        """Get list of available languages."""
        if self._problems_data is None:
            self._problems_data = create_default_problems_data()
        
        return list(self._problems_data.keys())
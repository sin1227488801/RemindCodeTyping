"""
Unit tests for system problems domain models.

Tests domain model validation, business rules, and data integrity.
"""

import pytest
from pydantic import ValidationError

from domain.system_problems import SystemProblem, SystemProblemResponse, DifficultyLevel


class TestDifficultyLevel:
    """Test cases for DifficultyLevel enum."""

    def test_difficulty_level_values(self):
        """Test that difficulty level enum has expected values."""
        assert DifficultyLevel.BEGINNER == "beginner"
        assert DifficultyLevel.INTERMEDIATE == "intermediate"
        assert DifficultyLevel.ADVANCED == "advanced"

    def test_difficulty_level_enum_membership(self):
        """Test difficulty level enum membership."""
        valid_levels = ["beginner", "intermediate", "advanced"]
        
        for level in valid_levels:
            assert level in DifficultyLevel._value2member_map_

    def test_difficulty_level_string_representation(self):
        """Test string representation of difficulty levels."""
        assert DifficultyLevel.BEGINNER.value == "beginner"
        assert DifficultyLevel.INTERMEDIATE.value == "intermediate"
        assert DifficultyLevel.ADVANCED.value == "advanced"


class TestSystemProblem:
    """Test cases for SystemProblem domain model."""

    def test_system_problem_creation_with_valid_data(self):
        """Test creating a system problem with valid data."""
        problem = SystemProblem(
            question="const arr = [1, 2, 3];",
            answer="const arr = [1, 2, 3];",
            difficulty=DifficultyLevel.BEGINNER,
            category="arrays"
        )
        
        assert problem.question == "const arr = [1, 2, 3];"
        assert problem.answer == "const arr = [1, 2, 3];"
        assert problem.difficulty == DifficultyLevel.BEGINNER
        assert problem.category == "arrays"
        assert problem.language is None

    def test_system_problem_creation_with_language(self):
        """Test creating a system problem with language specified."""
        problem = SystemProblem(
            question="print('Hello World')",
            answer="print('Hello World')",
            difficulty=DifficultyLevel.BEGINNER,
            category="basics",
            language="python3"
        )
        
        assert problem.language == "python3"

    def test_system_problem_difficulty_enum_validation(self):
        """Test that difficulty accepts DifficultyLevel enum values."""
        for difficulty in DifficultyLevel:
            problem = SystemProblem(
                question="test question",
                answer="test answer",
                difficulty=difficulty,
                category="test"
            )
            assert problem.difficulty == difficulty

    def test_system_problem_difficulty_string_validation(self):
        """Test that difficulty accepts string values."""
        problem = SystemProblem(
            question="test question",
            answer="test answer",
            difficulty="beginner",  # String instead of enum
            category="test"
        )
        assert problem.difficulty == "beginner"

    def test_system_problem_required_fields_validation(self):
        """Test that required fields are validated."""
        # Test missing question
        with pytest.raises(ValidationError) as exc_info:
            SystemProblem(
                answer="test answer",
                difficulty=DifficultyLevel.BEGINNER,
                category="test"
            )
        assert "question" in str(exc_info.value)

        # Test missing answer
        with pytest.raises(ValidationError) as exc_info:
            SystemProblem(
                question="test question",
                difficulty=DifficultyLevel.BEGINNER,
                category="test"
            )
        assert "answer" in str(exc_info.value)

        # Test missing difficulty
        with pytest.raises(ValidationError) as exc_info:
            SystemProblem(
                question="test question",
                answer="test answer",
                category="test"
            )
        assert "difficulty" in str(exc_info.value)

        # Test missing category
        with pytest.raises(ValidationError) as exc_info:
            SystemProblem(
                question="test question",
                answer="test answer",
                difficulty=DifficultyLevel.BEGINNER
            )
        assert "category" in str(exc_info.value)

    def test_system_problem_empty_string_validation(self):
        """Test validation of empty strings."""
        # Empty question should be allowed (might be intentional)
        problem = SystemProblem(
            question="",
            answer="test answer",
            difficulty=DifficultyLevel.BEGINNER,
            category="test"
        )
        assert problem.question == ""

        # Empty answer should be allowed (might be intentional)
        problem = SystemProblem(
            question="test question",
            answer="",
            difficulty=DifficultyLevel.BEGINNER,
            category="test"
        )
        assert problem.answer == ""

        # Empty category should be allowed
        problem = SystemProblem(
            question="test question",
            answer="test answer",
            difficulty=DifficultyLevel.BEGINNER,
            category=""
        )
        assert problem.category == ""

    def test_system_problem_json_serialization(self):
        """Test that system problem can be serialized to JSON."""
        problem = SystemProblem(
            question="function test() { return true; }",
            answer="function test() { return true; }",
            difficulty=DifficultyLevel.INTERMEDIATE,
            category="functions",
            language="javascript"
        )
        
        json_data = problem.model_dump()
        
        assert json_data["question"] == "function test() { return true; }"
        assert json_data["answer"] == "function test() { return true; }"
        assert json_data["difficulty"] == "intermediate"  # Enum value
        assert json_data["category"] == "functions"
        assert json_data["language"] == "javascript"

    def test_system_problem_json_deserialization(self):
        """Test that system problem can be deserialized from JSON."""
        json_data = {
            "question": "SELECT * FROM users;",
            "answer": "SELECT * FROM users;",
            "difficulty": "beginner",
            "category": "queries",
            "language": "sql"
        }
        
        problem = SystemProblem(**json_data)
        
        assert problem.question == "SELECT * FROM users;"
        assert problem.answer == "SELECT * FROM users;"
        assert problem.difficulty == "beginner"
        assert problem.category == "queries"
        assert problem.language == "sql"


class TestSystemProblemResponse:
    """Test cases for SystemProblemResponse API model."""

    def test_system_problem_response_creation(self):
        """Test creating a system problem response with valid data."""
        response = SystemProblemResponse(
            id="js_123456",
            question="const x = 5;",
            answer="const x = 5;",
            difficulty="beginner",
            category="variables",
            language="javascript"
        )
        
        assert response.id == "js_123456"
        assert response.question == "const x = 5;"
        assert response.answer == "const x = 5;"
        assert response.difficulty == "beginner"
        assert response.category == "variables"
        assert response.language == "javascript"

    def test_system_problem_response_required_fields(self):
        """Test that all fields are required for SystemProblemResponse."""
        # Test missing id
        with pytest.raises(ValidationError) as exc_info:
            SystemProblemResponse(
                question="test",
                answer="test",
                difficulty="beginner",
                category="test",
                language="test"
            )
        assert "id" in str(exc_info.value)

        # Test missing question
        with pytest.raises(ValidationError) as exc_info:
            SystemProblemResponse(
                id="test_123",
                answer="test",
                difficulty="beginner",
                category="test",
                language="test"
            )
        assert "question" in str(exc_info.value)

        # Test missing language
        with pytest.raises(ValidationError) as exc_info:
            SystemProblemResponse(
                id="test_123",
                question="test",
                answer="test",
                difficulty="beginner",
                category="test"
            )
        assert "language" in str(exc_info.value)

    def test_system_problem_response_from_domain_conversion(self):
        """Test converting domain model to response model."""
        domain_problem = SystemProblem(
            question="def hello(): print('Hello')",
            answer="def hello(): print('Hello')",
            difficulty=DifficultyLevel.BEGINNER,
            category="functions"
        )
        
        response = SystemProblemResponse.from_domain(domain_problem, "python3")
        
        assert response.question == domain_problem.question
        assert response.answer == domain_problem.answer
        assert response.difficulty == "beginner"  # Converted from enum
        assert response.category == domain_problem.category
        assert response.language == "python3"
        assert response.id.startswith("python3_")
        assert len(response.id) > len("python3_")  # Should have hash suffix

    def test_system_problem_response_from_domain_id_generation(self):
        """Test that from_domain generates stable IDs."""
        domain_problem = SystemProblem(
            question="<div>Hello</div>",
            answer="<div>Hello</div>",
            difficulty=DifficultyLevel.BEGINNER,
            category="tags"
        )
        
        # Generate response multiple times
        response1 = SystemProblemResponse.from_domain(domain_problem, "html")
        response2 = SystemProblemResponse.from_domain(domain_problem, "html")
        
        # IDs should be identical (stable)
        assert response1.id == response2.id
        
        # Different languages should generate different IDs
        response3 = SystemProblemResponse.from_domain(domain_problem, "xml")
        assert response1.id != response3.id

    def test_system_problem_response_from_domain_difficulty_handling(self):
        """Test difficulty handling in from_domain conversion."""
        # Test with DifficultyLevel enum
        domain_problem_enum = SystemProblem(
            question="test",
            answer="test",
            difficulty=DifficultyLevel.INTERMEDIATE,
            category="test"
        )
        
        response_enum = SystemProblemResponse.from_domain(domain_problem_enum, "test")
        assert response_enum.difficulty == "intermediate"
        
        # Test with string difficulty
        domain_problem_str = SystemProblem(
            question="test",
            answer="test",
            difficulty="advanced",  # String instead of enum
            category="test"
        )
        
        response_str = SystemProblemResponse.from_domain(domain_problem_str, "test")
        assert response_str.difficulty == "advanced"

    def test_system_problem_response_json_serialization(self):
        """Test JSON serialization of response model."""
        response = SystemProblemResponse(
            id="css_789",
            question="body { margin: 0; }",
            answer="body { margin: 0; }",
            difficulty="beginner",
            category="selectors",
            language="css"
        )
        
        json_data = response.model_dump()
        
        assert json_data["id"] == "css_789"
        assert json_data["question"] == "body { margin: 0; }"
        assert json_data["answer"] == "body { margin: 0; }"
        assert json_data["difficulty"] == "beginner"
        assert json_data["category"] == "selectors"
        assert json_data["language"] == "css"

    def test_system_problem_response_case_sensitivity(self):
        """Test case sensitivity in language handling."""
        domain_problem = SystemProblem(
            question="git status",
            answer="git status",
            difficulty=DifficultyLevel.BEGINNER,
            category="status"
        )
        
        # Test different cases
        response_lower = SystemProblemResponse.from_domain(domain_problem, "git")
        response_upper = SystemProblemResponse.from_domain(domain_problem, "GIT")
        response_mixed = SystemProblemResponse.from_domain(domain_problem, "Git")
        
        # Language should be preserved as provided
        assert response_lower.language == "git"
        assert response_upper.language == "GIT"
        assert response_mixed.language == "Git"
        
        # But IDs should be based on normalized language
        assert response_lower.id.startswith("git_")
        assert response_upper.id.startswith("git_")  # Normalized to lowercase
        assert response_mixed.id.startswith("git_")  # Normalized to lowercase
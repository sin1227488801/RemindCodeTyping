-- 追加のデモ問題を各言語で追加

INSERT INTO study_book (id, user_id, language, question, explanation, created_at, updated_at)
VALUES 

-- 追加のPython問題
(
    '550e8400-e29b-41d4-a716-446655440030',
    '550e8400-e29b-41d4-a716-446655440000',
    'Python',
    'class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age
    
    def greet(self):
        return f"Hi, I am {self.name}"

person = Person("Alice", 25)
print(person.greet())',
    'Pythonのクラス定義とオブジェクト指向プログラミングの例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440031',
    '550e8400-e29b-41d4-a716-446655440000',
    'Python',
    'data = {"apple": 5, "banana": 3, "orange": 8}
total = sum(data.values())
print(f"Total fruits: {total}")

for fruit, count in data.items():
    print(f"{fruit}: {count}")',
    'Pythonの辞書操作とfor文での反復処理の例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),

-- 追加のJavaScript問題
(
    '550e8400-e29b-41d4-a716-446655440032',
    '550e8400-e29b-41d4-a716-446655440000',
    'JavaScript',
    'const person = {
    name: "Bob",
    age: 30,
    greet() {
        return `Hello, I am $${this.name}`;
    }
};

console.log(person.greet());
console.log(`Age: $${person.age}`);',
    'JavaScriptのオブジェクトとメソッド、テンプレートリテラルの例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440033',
    '550e8400-e29b-41d4-a716-446655440000',
    'JavaScript',
    'const numbers = [1, 2, 3, 4, 5, 6];
const evens = numbers.filter(n => n % 2 === 0);
const sum = evens.reduce((acc, n) => acc + n, 0);

console.log("Even numbers:", evens);
console.log("Sum:", sum);',
    'JavaScriptの配列メソッド（filter、reduce）の使用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440034',
    '550e8400-e29b-41d4-a716-446655440000',
    'JavaScript',
    'async function fetchData() {
    try {
        const response = await fetch("/api/data");
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error:", error);
        return null;
    }
}',
    'JavaScriptの非同期処理（async/await）とエラーハンドリングの例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440035',
    '550e8400-e29b-41d4-a716-446655440000',
    'JavaScript',
    'class Calculator {
    constructor() {
        this.result = 0;
    }
    
    add(value) {
        this.result += value;
        return this;
    }
    
    multiply(value) {
        this.result *= value;
        return this;
    }
}

const calc = new Calculator();
console.log(calc.add(5).multiply(3).result);',
    'JavaScriptのクラスとメソッドチェーンの例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),

-- 追加のJava問題
(
    '550e8400-e29b-41d4-a716-446655440036',
    '550e8400-e29b-41d4-a716-446655440000',
    'Java',
    'import java.util.ArrayList;
import java.util.List;

public class ListExample {
    public static void main(String[] args) {
        List<String> fruits = new ArrayList<>();
        fruits.add("apple");
        fruits.add("banana");
        fruits.add("orange");
        
        for (String fruit : fruits) {
            System.out.println(fruit.toUpperCase());
        }
    }
}',
    'JavaのArrayListと拡張for文の使用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440037',
    '550e8400-e29b-41d4-a716-446655440000',
    'Java',
    'public class Person {
    private String name;
    private int age;
    
    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }
    
    public String getName() {
        return name;
    }
    
    public int getAge() {
        return age;
    }
    
    @Override
    public String toString() {
        return name + " (" + age + ")";
    }
}',
    'Javaのクラス、コンストラクタ、getter、toStringメソッドの例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440038',
    '550e8400-e29b-41d4-a716-446655440000',
    'Java',
    'import java.util.HashMap;
import java.util.Map;

public class MapExample {
    public static void main(String[] args) {
        Map<String, Integer> scores = new HashMap<>();
        scores.put("Alice", 95);
        scores.put("Bob", 87);
        scores.put("Charlie", 92);
        
        for (Map.Entry<String, Integer> entry : scores.entrySet()) {
            System.out.println(entry.getKey() + ": " + entry.getValue());
        }
    }
}',
    'JavaのHashMapと反復処理の使用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440039',
    '550e8400-e29b-41d4-a716-446655440000',
    'Java',
    'public class ExceptionExample {
    public static int divide(int a, int b) {
        try {
            return a / b;
        } catch (ArithmeticException e) {
            System.out.println("Cannot divide by zero!");
            return 0;
        }
    }
    
    public static void main(String[] args) {
        System.out.println(divide(10, 2));
        System.out.println(divide(10, 0));
    }
}',
    'Javaの例外処理（try-catch）の使用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),

-- 追加のSQL問題
(
    '550e8400-e29b-41d4-a716-446655440040',
    '550e8400-e29b-41d4-a716-446655440000',
    'SQL',
    'SELECT 
    department,
    COUNT(*) as employee_count,
    AVG(salary) as avg_salary
FROM employees 
GROUP BY department
HAVING COUNT(*) > 5
ORDER BY avg_salary DESC;',
    'SQLのGROUP BY、HAVING、集約関数の使用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440041',
    '550e8400-e29b-41d4-a716-446655440000',
    'SQL',
    'SELECT 
    e.name,
    e.salary,
    d.department_name
FROM employees e
INNER JOIN departments d ON e.department_id = d.id
WHERE e.salary > 50000
ORDER BY e.salary DESC;',
    'SQLのJOIN（内部結合）とWHERE条件の使用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440042',
    '550e8400-e29b-41d4-a716-446655440000',
    'SQL',
    'INSERT INTO customers (name, email, city) 
VALUES 
    (''John Doe'', ''john@example.com'', ''Tokyo''),
    (''Jane Smith'', ''jane@example.com'', ''Osaka''),
    (''Bob Johnson'', ''bob@example.com'', ''Kyoto'');',
    'SQLの複数行INSERT文の使用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440043',
    '550e8400-e29b-41d4-a716-446655440000',
    'SQL',
    'CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    order_date DATE DEFAULT CURRENT_DATE,
    total_amount DECIMAL(10,2),
    status VARCHAR(20) DEFAULT ''pending'',
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);',
    'SQLのテーブル作成（CREATE TABLE）と制約の定義例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440044',
    '550e8400-e29b-41d4-a716-446655440000',
    'SQL',
    'WITH monthly_sales AS (
    SELECT 
        EXTRACT(MONTH FROM order_date) as month,
        SUM(total_amount) as sales
    FROM orders 
    WHERE EXTRACT(YEAR FROM order_date) = 2024
    GROUP BY EXTRACT(MONTH FROM order_date)
)
SELECT month, sales
FROM monthly_sales
WHERE sales > 10000;',
    'SQLのCTE（Common Table Expression）と日付関数の使用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
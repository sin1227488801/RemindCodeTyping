-- 各言語20問ずつになるよう追加問題を作成

INSERT INTO study_book (id, user_id, language, question, explanation, created_at, updated_at)
VALUES 

-- Python追加問題（現在7問 → 20問にするため13問追加）
(
    '550e8400-e29b-41d4-a716-446655440050',
    '550e8400-e29b-41d4-a716-446655440000',
    'Python',
    'import math

def calculate_area(radius):
    return math.pi * radius ** 2

print(f"Area: {calculate_area(5):.2f}")',
    'Pythonのモジュールインポートと数学計算の例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440051',
    '550e8400-e29b-41d4-a716-446655440000',
    'Python',
    'try:
    age = int(input("Enter age: "))
    if age < 0:
        raise ValueError("Age cannot be negative")
    print(f"You are {age} years old")
except ValueError as e:
    print(f"Error: {e}")',
    'Pythonの例外処理とカスタム例外の発生例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440052',
    '550e8400-e29b-41d4-a716-446655440000',
    'Python',
    'with open("data.txt", "w") as file:
    file.write("Hello World\\n")
    file.write("Python Programming")

with open("data.txt", "r") as file:
    content = file.read()
    print(content)',
    'Pythonのファイル操作（with文）の例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440053',
    '550e8400-e29b-41d4-a716-446655440000',
    'Python',
    'def decorator(func):
    def wrapper(*args, **kwargs):
        print("Before function call")
        result = func(*args, **kwargs)
        print("After function call")
        return result
    return wrapper

@decorator
def greet(name):
    return f"Hello, {name}!"',
    'Pythonのデコレータの基本的な使用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440054',
    '550e8400-e29b-41d4-a716-446655440000',
    'Python',
    'numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
evens = [x for x in numbers if x % 2 == 0]
squares = [x**2 for x in evens]
print(f"Even squares: {squares}")',
    'Pythonのリスト内包表記の応用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440055',
    '550e8400-e29b-41d4-a716-446655440000',
    'Python',
    'from collections import Counter

text = "hello world"
char_count = Counter(text)
most_common = char_count.most_common(3)
print(f"Most common chars: {most_common}")',
    'PythonのCollectionsモジュールとCounterの使用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440056',
    '550e8400-e29b-41d4-a716-446655440000',
    'Python',
    'def generator_example():
    for i in range(5):
        yield i * 2

gen = generator_example()
for value in gen:
    print(f"Generated: {value}")',
    'Pythonのジェネレータ関数とyieldの使用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440057',
    '550e8400-e29b-41d4-a716-446655440000',
    'Python',
    'import json

data = {"name": "Alice", "age": 30, "city": "Tokyo"}
json_string = json.dumps(data, indent=2)
print(json_string)

parsed_data = json.loads(json_string)
print(f"Name: {parsed_data[''name'']}")',
    'PythonのJSON処理（dumps、loads）の例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440058',
    '550e8400-e29b-41d4-a716-446655440000',
    'Python',
    'class Animal:
    def __init__(self, name):
        self.name = name
    
    def speak(self):
        pass

class Dog(Animal):
    def speak(self):
        return f"{self.name} says Woof!"

dog = Dog("Buddy")
print(dog.speak())',
    'Pythonの継承とメソッドオーバーライドの例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440059',
    '550e8400-e29b-41d4-a716-446655440000',
    'Python',
    'from datetime import datetime, timedelta

now = datetime.now()
tomorrow = now + timedelta(days=1)
formatted = now.strftime("%Y-%m-%d %H:%M:%S")

print(f"Now: {formatted}")
print(f"Tomorrow: {tomorrow.date()}")',
    'Pythonの日時処理（datetime）の使用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440060',
    '550e8400-e29b-41d4-a716-446655440000',
    'Python',
    'import re

text = "Contact us at: john@example.com or jane@test.org"
pattern = r"\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b"
emails = re.findall(pattern, text)

for email in emails:
    print(f"Found email: {email}")',
    'Pythonの正規表現（re）を使ったパターンマッチングの例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440061',
    '550e8400-e29b-41d4-a716-446655440000',
    'Python',
    'def fibonacci_memo(n, memo={}):
    if n in memo:
        return memo[n]
    if n <= 1:
        return n
    memo[n] = fibonacci_memo(n-1, memo) + fibonacci_memo(n-2, memo)
    return memo[n]

print(f"Fibonacci(20): {fibonacci_memo(20)}")',
    'Pythonのメモ化を使った効率的なフィボナッチ数列の例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440062',
    '550e8400-e29b-41d4-a716-446655440000',
    'Python',
    'import threading
import time

def worker(name):
    for i in range(3):
        print(f"Worker {name}: {i}")
        time.sleep(1)

thread1 = threading.Thread(target=worker, args=("A",))
thread2 = threading.Thread(target=worker, args=("B",))

thread1.start()
thread2.start()',
    'Pythonのマルチスレッド処理の基本例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),

-- JavaScript追加問題（現在5問 → 20問にするため15問追加）
(
    '550e8400-e29b-41d4-a716-446655440070',
    '550e8400-e29b-41d4-a716-446655440000',
    'JavaScript',
    'const users = [
    {name: "Alice", age: 25},
    {name: "Bob", age: 30},
    {name: "Charlie", age: 35}
];

const names = users.map(user => user.name);
const adults = users.filter(user => user.age >= 30);

console.log("Names:", names);
console.log("Adults:", adults);',
    'JavaScriptのオブジェクト配列操作の例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440071',
    '550e8400-e29b-41d4-a716-446655440000',
    'JavaScript',
    'function createCounter() {
    let count = 0;
    return {
        increment: () => ++count,
        decrement: () => --count,
        getValue: () => count
    };
}

const counter = createCounter();
console.log(counter.increment());
console.log(counter.getValue());',
    'JavaScriptのクロージャとプライベート変数の例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440072',
    '550e8400-e29b-41d4-a716-446655440000',
    'JavaScript',
    'const promise1 = Promise.resolve(3);
const promise2 = new Promise(resolve => setTimeout(() => resolve("foo"), 1000));
const promise3 = Promise.resolve(42);

Promise.all([promise1, promise2, promise3])
    .then(values => {
        console.log("All resolved:", values);
    });',
    'JavaScriptのPromise.allを使った並行処理の例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440073',
    '550e8400-e29b-41d4-a716-446655440000',
    'JavaScript',
    'const obj = {a: 1, b: 2, c: 3};
const {a, ...rest} = obj;
const newObj = {...obj, d: 4};

console.log("a:", a);
console.log("rest:", rest);
console.log("newObj:", newObj);',
    'JavaScriptの分割代入とスプレッド演算子の例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440074',
    '550e8400-e29b-41d4-a716-446655440000',
    'JavaScript',
    'class EventEmitter {
    constructor() {
        this.events = {};
    }
    
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }
    
    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(callback => callback(data));
        }
    }
}',
    'JavaScriptのイベントエミッターパターンの実装例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440075',
    '550e8400-e29b-41d4-a716-446655440000',
    'JavaScript',
    'const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
};

const debouncedLog = debounce(console.log, 300);
debouncedLog("Hello");
debouncedLog("World");',
    'JavaScriptのデバウンス関数の実装例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440076',
    '550e8400-e29b-41d4-a716-446655440000',
    'JavaScript',
    'const fetchUserData = async (userId) => {
    try {
        const response = await fetch(`/api/users/$${userId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: $${response.status}`);
        }
        const userData = await response.json();
        return userData;
    } catch (error) {
        console.error("Failed to fetch user data:", error);
        return null;
    }
};',
    'JavaScriptの非同期API呼び出しとエラーハンドリングの例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440077',
    '550e8400-e29b-41d4-a716-446655440000',
    'JavaScript',
    'const numbers = [1, 2, 3, 4, 5];
const sum = numbers.reduce((acc, num) => acc + num, 0);
const product = numbers.reduce((acc, num) => acc * num, 1);
const max = numbers.reduce((acc, num) => Math.max(acc, num));

console.log(`Sum: ${sum}, Product: ${product}, Max: ${max}`);',
    'JavaScriptのreduceメソッドの様々な使用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440078',
    '550e8400-e29b-41d4-a716-446655440000',
    'JavaScript',
    'const memoize = (fn) => {
    const cache = new Map();
    return (...args) => {
        const key = JSON.stringify(args);
        if (cache.has(key)) {
            return cache.get(key);
        }
        const result = fn(...args);
        cache.set(key, result);
        return result;
    };
};',
    'JavaScriptのメモ化関数の実装例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440079',
    '550e8400-e29b-41d4-a716-446655440000',
    'JavaScript',
    'const data = [
    {category: "A", value: 10},
    {category: "B", value: 20},
    {category: "A", value: 15}
];

const grouped = data.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.value;
    return acc;
}, {});

console.log("Grouped:", grouped);',
    'JavaScriptでのデータグループ化処理の例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440080',
    '550e8400-e29b-41d4-a716-446655440000',
    'JavaScript',
    'function* fibonacci() {
    let a = 0, b = 1;
    while (true) {
        yield a;
        [a, b] = [b, a + b];
    }
}

const fib = fibonacci();
for (let i = 0; i < 10; i++) {
    console.log(fib.next().value);
}',
    'JavaScriptのジェネレータ関数の使用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440081',
    '550e8400-e29b-41d4-a716-446655440000',
    'JavaScript',
    'const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            console.log("Element is visible");
            entry.target.classList.add("visible");
        }
    });
});

const element = document.querySelector(".observe-me");
observer.observe(element);',
    'JavaScriptのIntersection Observer APIの使用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440082',
    '550e8400-e29b-41d4-a716-446655440000',
    'JavaScript',
    'const throttle = (func, limit) => {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};',
    'JavaScriptのスロットル関数の実装例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440083',
    '550e8400-e29b-41d4-a716-446655440000',
    'JavaScript',
    'const deepClone = (obj) => {
    if (obj === null || typeof obj !== "object") {
        return obj;
    }
    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }
    if (obj instanceof Array) {
        return obj.map(item => deepClone(item));
    }
    const cloned = {};
    for (let key in obj) {
        cloned[key] = deepClone(obj[key]);
    }
    return cloned;
};',
    'JavaScriptの深いコピー（ディープクローン）の実装例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440084',
    '550e8400-e29b-41d4-a716-446655440000',
    'JavaScript',
    'const pipe = (...functions) => (value) => 
    functions.reduce((acc, fn) => fn(acc), value);

const addOne = x => x + 1;
const double = x => x * 2;
const square = x => x * x;

const transform = pipe(addOne, double, square);
console.log(transform(3)); // ((3 + 1) * 2)^2 = 64',
    'JavaScriptの関数型プログラミング（パイプ）の例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),

-- Java追加問題（現在4問 → 20問にするため16問追加）
(
    '550e8400-e29b-41d4-a716-446655440090',
    '550e8400-e29b-41d4-a716-446655440000',
    'Java',
    'import java.util.Optional;

public class OptionalExample {
    public static void main(String[] args) {
        Optional<String> optional = Optional.of("Hello");
        
        optional.ifPresent(System.out::println);
        
        String result = optional
            .map(String::toUpperCase)
            .orElse("Default");
            
        System.out.println(result);
    }
}',
    'JavaのOptionalクラスの使用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440091',
    '550e8400-e29b-41d4-a716-446655440000',
    'Java',
    'import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class DateTimeExample {
    public static void main(String[] args) {
        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        
        String formatted = now.format(formatter);
        System.out.println("Current time: " + formatted);
    }
}',
    'Javaの日時処理（LocalDateTime）の使用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440092',
    '550e8400-e29b-41d4-a716-446655440000',
    'Java',
    'import java.util.concurrent.CompletableFuture;

public class AsyncExample {
    public static void main(String[] args) {
        CompletableFuture<String> future = CompletableFuture
            .supplyAsync(() -> "Hello")
            .thenApply(s -> s + " World")
            .thenApply(String::toUpperCase);
            
        future.thenAccept(System.out::println);
    }
}',
    'Javaの非同期処理（CompletableFuture）の例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440093',
    '550e8400-e29b-41d4-a716-446655440000',
    'Java',
    'public enum Status {
    PENDING("Pending"),
    PROCESSING("Processing"),
    COMPLETED("Completed");
    
    private final String displayName;
    
    Status(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
}',
    'Javaのenumとコンストラクタの使用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440094',
    '550e8400-e29b-41d4-a716-446655440000',
    'Java',
    'import java.util.function.Predicate;
import java.util.function.Function;

public class FunctionalExample {
    public static void main(String[] args) {
        Predicate<Integer> isEven = n -> n % 2 == 0;
        Function<Integer, Integer> square = n -> n * n;
        
        int number = 4;
        if (isEven.test(number)) {
            System.out.println("Square: " + square.apply(number));
        }
    }
}',
    'Javaの関数型インターフェース（Predicate、Function）の例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440095',
    '550e8400-e29b-41d4-a716-446655440000',
    'Java',
    'import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;

public class FileExample {
    public static void main(String[] args) {
        try {
            List<String> lines = Files.readAllLines(Paths.get("data.txt"));
            lines.forEach(System.out::println);
        } catch (IOException e) {
            System.err.println("Error reading file: " + e.getMessage());
        }
    }
}',
    'Javaのファイル読み込み（NIO.2）の使用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440096',
    '550e8400-e29b-41d4-a716-446655440000',
    'Java',
    'public class GenericExample<T> {
    private T data;
    
    public GenericExample(T data) {
        this.data = data;
    }
    
    public T getData() {
        return data;
    }
    
    public <U> U process(U input) {
        System.out.println("Processing: " + input);
        return input;
    }
}',
    'Javaのジェネリクス（総称型）の使用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440097',
    '550e8400-e29b-41d4-a716-446655440000',
    'Java',
    'import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;

@Retention(RetentionPolicy.RUNTIME)
@interface MyAnnotation {
    String value() default "default";
}

public class AnnotationExample {
    @MyAnnotation("test")
    public void annotatedMethod() {
        System.out.println("Annotated method called");
    }
}',
    'Javaのアノテーション定義と使用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440098',
    '550e8400-e29b-41d4-a716-446655440000',
    'Java',
    'import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

public class ThreadPoolExample {
    public static void main(String[] args) throws InterruptedException {
        ExecutorService executor = Executors.newFixedThreadPool(3);
        
        for (int i = 0; i < 5; i++) {
            final int taskId = i;
            executor.submit(() -> {
                System.out.println("Task " + taskId + " executed");
            });
        }
        
        executor.shutdown();
        executor.awaitTermination(1, TimeUnit.MINUTES);
    }
}',
    'Javaのスレッドプール（ExecutorService）の使用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440099',
    '550e8400-e29b-41d4-a716-446655440000',
    'Java',
    'public abstract class Shape {
    protected String color;
    
    public Shape(String color) {
        this.color = color;
    }
    
    public abstract double getArea();
    
    public void displayInfo() {
        System.out.println("Color: " + color + ", Area: " + getArea());
    }
}

class Circle extends Shape {
    private double radius;
    
    public Circle(String color, double radius) {
        super(color);
        this.radius = radius;
    }
    
    @Override
    public double getArea() {
        return Math.PI * radius * radius;
    }
}',
    'Javaの抽象クラスと継承の使用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440100',
    '550e8400-e29b-41d4-a716-446655440000',
    'Java',
    'import java.util.regex.Pattern;
import java.util.regex.Matcher;

public class RegexExample {
    public static void main(String[] args) {
        String text = "Contact: john@example.com or call 123-456-7890";
        
        Pattern emailPattern = Pattern.compile("\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b");
        Matcher matcher = emailPattern.matcher(text);
        
        while (matcher.find()) {
            System.out.println("Found email: " + matcher.group());
        }
    }
}',
    'Javaの正規表現（Pattern、Matcher）の使用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440101',
    '550e8400-e29b-41d4-a716-446655440000',
    'Java',
    'import java.util.Collections;
import java.util.List;
import java.util.ArrayList;
import java.util.Comparator;

public class CollectionsExample {
    public static void main(String[] args) {
        List<String> names = new ArrayList<>();
        names.add("Charlie");
        names.add("Alice");
        names.add("Bob");
        
        Collections.sort(names);
        System.out.println("Sorted: " + names);
        
        names.sort(Comparator.comparing(String::length));
        System.out.println("By length: " + names);
    }
}',
    'JavaのCollectionsユーティリティとComparatorの使用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440102',
    '550e8400-e29b-41d4-a716-446655440000',
    'Java',
    'public class BuilderPattern {
    private String name;
    private int age;
    private String email;
    
    private BuilderPattern(Builder builder) {
        this.name = builder.name;
        this.age = builder.age;
        this.email = builder.email;
    }
    
    public static class Builder {
        private String name;
        private int age;
        private String email;
        
        public Builder setName(String name) {
            this.name = name;
            return this;
        }
        
        public Builder setAge(int age) {
            this.age = age;
            return this;
        }
        
        public Builder setEmail(String email) {
            this.email = email;
            return this;
        }
        
        public BuilderPattern build() {
            return new BuilderPattern(this);
        }
    }
}',
    'JavaのBuilderパターンの実装例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440103',
    '550e8400-e29b-41d4-a716-446655440000',
    'Java',
    'import java.util.concurrent.locks.ReentrantLock;

public class LockExample {
    private final ReentrantLock lock = new ReentrantLock();
    private int counter = 0;
    
    public void increment() {
        lock.lock();
        try {
            counter++;
            System.out.println("Counter: " + counter);
        } finally {
            lock.unlock();
        }
    }
    
    public int getCounter() {
        lock.lock();
        try {
            return counter;
        } finally {
            lock.unlock();
        }
    }
}',
    'Javaの明示的ロック（ReentrantLock）の使用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440104',
    '550e8400-e29b-41d4-a716-446655440000',
    'Java',
    'import java.lang.reflect.Method;

public class ReflectionExample {
    public void publicMethod() {
        System.out.println("Public method called");
    }
    
    private void privateMethod() {
        System.out.println("Private method called");
    }
    
    public static void main(String[] args) throws Exception {
        ReflectionExample obj = new ReflectionExample();
        Class<?> clazz = obj.getClass();
        
        Method[] methods = clazz.getDeclaredMethods();
        for (Method method : methods) {
            System.out.println("Method: " + method.getName());
        }
    }
}',
    'Javaのリフレクション（Reflection）の基本的な使用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440105',
    '550e8400-e29b-41d4-a716-446655440000',
    'Java',
    'public class SingletonPattern {
    private static volatile SingletonPattern instance;
    
    private SingletonPattern() {
        // Private constructor
    }
    
    public static SingletonPattern getInstance() {
        if (instance == null) {
            synchronized (SingletonPattern.class) {
                if (instance == null) {
                    instance = new SingletonPattern();
                }
            }
        }
        return instance;
    }
    
    public void doSomething() {
        System.out.println("Singleton method called");
    }
}',
    'JavaのSingletonパターン（ダブルチェックロッキング）の実装例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),

-- SQL追加問題（現在7問 → 20問にするため13問追加）
(
    '550e8400-e29b-41d4-a716-446655440110',
    '550e8400-e29b-41d4-a716-446655440000',
    'SQL',
    'SELECT 
    product_name,
    price,
    CASE 
        WHEN price < 100 THEN ''Cheap''
        WHEN price BETWEEN 100 AND 500 THEN ''Moderate''
        ELSE ''Expensive''
    END as price_category
FROM products
ORDER BY price;',
    'SQLのCASE文を使った条件分岐の例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440111',
    '550e8400-e29b-41d4-a716-446655440000',
    'SQL',
    'SELECT 
    customer_id,
    order_date,
    total_amount,
    ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date DESC) as rn
FROM orders
WHERE ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date DESC) = 1;',
    'SQLのウィンドウ関数（ROW_NUMBER）を使った最新レコード取得の例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440112',
    '550e8400-e29b-41d4-a716-446655440000',
    'SQL',
    'CREATE INDEX idx_customer_order_date 
ON orders (customer_id, order_date DESC);

CREATE INDEX idx_product_name 
ON products (product_name);

EXPLAIN SELECT * FROM orders 
WHERE customer_id = 123 
AND order_date >= ''2024-01-01'';',
    'SQLのインデックス作成とクエリ実行計画の確認例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440113',
    '550e8400-e29b-41d4-a716-446655440000',
    'SQL',
    'BEGIN TRANSACTION;

UPDATE accounts 
SET balance = balance - 100 
WHERE account_id = 1;

UPDATE accounts 
SET balance = balance + 100 
WHERE account_id = 2;

COMMIT;',
    'SQLのトランザクション処理の例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440114',
    '550e8400-e29b-41d4-a716-446655440000',
    'SQL',
    'CREATE VIEW customer_summary AS
SELECT 
    c.customer_id,
    c.name,
    COUNT(o.order_id) as total_orders,
    COALESCE(SUM(o.total_amount), 0) as total_spent
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.name;',
    'SQLのビュー（VIEW）作成の例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440115',
    '550e8400-e29b-41d4-a716-446655440000',
    'SQL',
    'SELECT 
    department,
    salary,
    AVG(salary) OVER (PARTITION BY department) as dept_avg,
    salary - AVG(salary) OVER (PARTITION BY department) as diff_from_avg
FROM employees
ORDER BY department, salary DESC;',
    'SQLのウィンドウ関数を使った部署別平均との比較例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440116',
    '550e8400-e29b-41d4-a716-446655440000',
    'SQL',
    'DELIMITER //
CREATE PROCEDURE GetCustomerOrders(IN customer_id INT)
BEGIN
    SELECT 
        o.order_id,
        o.order_date,
        o.total_amount,
        COUNT(oi.item_id) as item_count
    FROM orders o
    LEFT JOIN order_items oi ON o.order_id = oi.order_id
    WHERE o.customer_id = customer_id
    GROUP BY o.order_id, o.order_date, o.total_amount
    ORDER BY o.order_date DESC;
END //
DELIMITER ;',
    'SQLのストアドプロシージャ作成の例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440117',
    '550e8400-e29b-41d4-a716-446655440000',
    'SQL',
    'SELECT 
    p.product_name,
    c.category_name,
    p.price,
    RANK() OVER (PARTITION BY c.category_name ORDER BY p.price DESC) as price_rank
FROM products p
INNER JOIN categories c ON p.category_id = c.category_id
WHERE RANK() OVER (PARTITION BY c.category_name ORDER BY p.price DESC) <= 3;',
    'SQLのRANK関数を使ったカテゴリ別上位商品取得の例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440118',
    '550e8400-e29b-41d4-a716-446655440000',
    'SQL',
    'SELECT 
    order_date,
    total_amount,
    SUM(total_amount) OVER (ORDER BY order_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) as running_total,
    LAG(total_amount, 1) OVER (ORDER BY order_date) as prev_amount
FROM orders
ORDER BY order_date;',
    'SQLの累計計算とLAG関数の使用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440119',
    '550e8400-e29b-41d4-a716-446655440000',
    'SQL',
    'CREATE TRIGGER update_inventory
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
    UPDATE products 
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE product_id = NEW.product_id;
END;',
    'SQLのトリガー（TRIGGER）作成の例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440120',
    '550e8400-e29b-41d4-a716-446655440000',
    'SQL',
    'SELECT 
    customer_id,
    order_date,
    total_amount,
    NTILE(4) OVER (ORDER BY total_amount) as quartile
FROM orders
WHERE order_date >= ''2024-01-01''
ORDER BY total_amount;',
    'SQLのNTILE関数を使った四分位数計算の例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440121',
    '550e8400-e29b-41d4-a716-446655440000',
    'SQL',
    'WITH RECURSIVE employee_hierarchy AS (
    SELECT employee_id, name, manager_id, 0 as level
    FROM employees 
    WHERE manager_id IS NULL
    
    UNION ALL
    
    SELECT e.employee_id, e.name, e.manager_id, eh.level + 1
    FROM employees e
    INNER JOIN employee_hierarchy eh ON e.manager_id = eh.employee_id
)
SELECT * FROM employee_hierarchy
ORDER BY level, name;',
    'SQLの再帰CTE（RECURSIVE）を使った階層データ取得の例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '550e8400-e29b-41d4-a716-446655440122',
    '550e8400-e29b-41d4-a716-446655440000',
    'SQL',
    'SELECT 
    DATE_TRUNC(''month'', order_date) as month,
    COUNT(*) as order_count,
    SUM(total_amount) as monthly_revenue,
    AVG(total_amount) as avg_order_value,
    PERCENT_RANK() OVER (ORDER BY SUM(total_amount)) as revenue_percentile
FROM orders 
WHERE order_date >= ''2024-01-01''
GROUP BY DATE_TRUNC(''month'', order_date)
ORDER BY month;',
    'SQLの月次集計とPERCENT_RANK関数の使用例です。',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
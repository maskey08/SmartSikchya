"""
create_dataset.py — generates training data for DistilBERT difficulty classifier.

WHY this script exists:
Your 50 questions already have manually-assigned difficulty labels in the DB.
This script exports them as a CSV that the training script can read.
It also includes a hardcoded set of extra examples to bootstrap training
when the DB has fewer than 60 questions per class.

Run from the models/ folder:
  python create_dataset.py
"""
import csv
import os

# ── Hardcoded bootstrap examples ─────────────────────────────────
# These supplement whatever comes from your DB.
# WHY hardcode? Because fine-tuning needs at least ~60 examples total
# to produce a meaningful model. These are designed to cover the
# linguistic patterns DistilBERT should learn to distinguish.

BOOTSTRAP_EXAMPLES = [
    # EASY — short, direct recall, single operation
    ("What is 5 + 3?", "easy"),
    ("How many sides does a triangle have?", "easy"),
    ("What is the symbol for water?", "easy"),
    ("Which planet is closest to the Sun?", "easy"),
    ("What is the capital of Nepal?", "easy"),
    ("Name the gas that plants absorb during photosynthesis.", "easy"),
    ("What is 10 divided by 2?", "easy"),
    ("How many degrees are in a right angle?", "easy"),
    ("What does CPU stand for?", "easy"),
    ("What is the SI unit of time?", "easy"),
    ("Define velocity.", "easy"),
    ("What is the chemical symbol for Gold?", "easy"),
    ("How many bytes are in a kilobyte?", "easy"),
    ("What is a noun?", "easy"),
    ("Name a primary colour.", "easy"),
    ("What is 7 × 8?", "easy"),
    ("Define an atom.", "easy"),
    ("What is the boiling point of water in Celsius?", "easy"),
    ("What type of animal is a shark?", "easy"),
    ("Who invented the telephone?", "easy"),

    # MEDIUM — multi-step or requires understanding, not just recall
    ("Solve for x: 3x + 7 = 22", "medium"),
    ("Find the area of a circle with radius 5 cm.", "medium"),
    ("Calculate the speed of an object that travels 120m in 4 seconds.", "medium"),
    ("What is the difference between mitosis and meiosis?", "medium"),
    ("Convert 0.75 to a fraction in its simplest form.", "medium"),
    ("Explain Newton's Second Law of Motion with an example.", "medium"),
    ("What is the pH of an acid solution?", "medium"),
    ("Identify the subject and predicate: The cat sat on the mat.", "medium"),
    ("Find the value of y if 2y - 4 = 10.", "medium"),
    ("Calculate the perimeter of a rectangle with length 12 and width 8.", "medium"),
    ("What is the difference between hardware and software?", "medium"),
    ("Explain what an IP address is.", "medium"),
    ("How does a router differ from a switch?", "medium"),
    ("Write a for loop that prints numbers 1 to 5 in Python.", "medium"),
    ("What is the role of the nucleus in a cell?", "medium"),
    ("Calculate the compound interest on Rs. 1000 at 10% for 2 years.", "medium"),
    ("What does the keyword 'return' do in a function?", "medium"),
    ("Identify whether the sentence is active or passive voice: 'The book was read by him.'", "medium"),
    ("What is the difference between a list and a tuple in Python?", "medium"),
    ("Explain what recursion is with a simple example.", "medium"),

    # HARD — complex reasoning, multi-concept, analysis or evaluation
    ("Prove that the sum of angles in any triangle is 180 degrees.", "hard"),
    ("Derive the quadratic formula from ax² + bx + c = 0.", "hard"),
    ("Explain the working of a Turing machine and its significance in computability theory.", "hard"),
    ("Discuss the thermodynamic implications of entropy in a closed system.", "hard"),
    ("Analyse the time complexity of merge sort and justify using recurrence relations.", "hard"),
    ("How does the OSI model facilitate network communication? Discuss each layer.", "hard"),
    ("Factorise completely: 2x³ + 3x² - 11x - 6", "hard"),
    ("Evaluate: ∫(3x² + 2x - 1)dx from 0 to 2", "hard"),
    ("Compare and contrast object-oriented and functional programming paradigms.", "hard"),
    ("Explain how HTTPS differs from HTTP and describe the role of TLS certificates.", "hard"),
    ("Critically evaluate the impact of adaptive learning on student performance outcomes.", "hard"),
    ("Given a binary tree, write an algorithm to find the height of the tree.", "hard"),
    ("Derive the equation of motion v² = u² + 2as from first principles.", "hard"),
    ("Explain the concept of polymorphism in OOP with practical examples.", "hard"),
    ("What are the key differences between supervised, unsupervised, and reinforcement learning?", "hard"),
    ("Prove by induction that the sum of first n natural numbers is n(n+1)/2.", "hard"),
    ("Discuss the limitations of the Bohr model of the atom.", "hard"),
    ("Explain how a neural network learns using backpropagation.", "hard"),
    ("Describe the ACID properties of a database transaction.", "hard"),
    ("Explain why quicksort has O(n²) worst case but is still preferred in practice.", "hard"),
    ("What is the next-highest prime number after 67?", "easy"),
("A blouse normally sells for $138, but is on sale for 25% off. What is the cost of the blouse?", "medium"),
("A box of laundry detergent contains 16.5 oz of product. What is the maximum number of loads that can be washed if each load requires 34 oz?", "medium"),
("A crane raises one end of a 3,300 lb steel beam. If the crane supports 30% of the beam’s weight, how many pounds does it support?", "easy"),
("A function f(x) = 2x² + 7. What is the value of 2f(x)?", "hard"),
("Which of the following could be a graph of the function y = 1/x?", "medium"),
("Which expression is equivalent to (a+b)(a−b)?", "easy"),
("A tire rotates at 500 rpm when the car travels at 50 kph. What is the circumference of the tire?", "medium"),
("Each year, an investment increases by 0.49%. Which function models this growth?", "medium"),
("For exponential function f, if f(1)=k, which form shows k clearly?", "hard"),
("What number is 15 percent of x?", "easy"),
("If N is a 3-digit number where each digit is a factor of N, what is N?", "hard"),
("What is the monthly rent for an apartment based on given conditions?", "medium"),
("If y + 40x + 2 = 0, what is xy?", "easy"),
("Find the value of xy given two equations.", "easy"),
("Buckets X and Y problem involving fractions of capacity.", "medium"),
("Is x divisible by 39?", "hard"),
("Drug study: did more patients improve than experience side effects?", "hard"),
("The ceremony of driving the golden spike passage question.", "medium"),
("Fishing story passage: what best summarizes the passage?", "easy"),
("Spectroscopic fingerprint passage: fill in the blank.", "easy"),
("Wishcycling passage: fill in the blank.", "easy"),
("Sunspots passage: fill in the blank.", "easy"),
("Soursop health benefits passage: fill in the blank.", "easy"),
("If a circle has diameter 8 inches, what is the circumference?", "medium"),
("What is the measure of the angle in the figure?", "medium"),
("Which letter represents the vertex?", "easy"),
("Angle R and T problem in radians.", "medium"),
("Mean score problem with 5 tests.", "easy"),
("Venn diagram farm problem.", "medium"),
("Triangle angle problem.", "easy"),
("Tickets and vouchers distribution problem.", "easy"),
("Car skid speed estimation problem.", "medium"),
("Convert 30 mph to feet per second.", "easy"),
("Cost of bags, caps, and gloves system problem.", "medium"),
("Bulb life inequality problem.", "hard"),
("Three-digit number divisibility problem.", "hard"),
("Remainder and divisibility statements problem.", "hard"),
("Nutrition intake relation problem.", "medium"),
("Apples and oranges combinations problem.", "hard"),
("Bus trip fare range problem.", "hard"),
("Find cost of an orange from equations.", "easy"),
("Discounted jacket original price.", "easy"),
("Average of numbers problem.", "easy"),
("Medication dosage decrease problem.", "easy"),
("Probability of rolling a 2 on a 14-sided die.", "medium"),
("Circle area ratio problem.", "easy"),
("Mean of data set.", "easy"),
("Solve 3/x = 5/7.", "easy"),
("Wheel revolution rate problem.", "easy"),
("Percent decrease then increase problem.", "medium"),
("Mistake ratio test problem.", "medium"),
("Coin distribution problem.", "easy"),
("Overtime pay calculation.", "medium"),
("Walking rates meeting problem.", "medium"),
("Madagascar passage question.", "hard"),
("Grocery store pricing argument.", "easy"),
("Farm machinery argument question.", "medium"),
("Artificial language argument.", "hard"),
("Greek art passage.", "easy"),
("Industrial revolution passage.", "medium"),
("Anole habitat experiment.", "medium"),
("Fish tank SGR experiment question.", "hard"),
("Food grams per tank question.", "medium"),
("Global warming debate question.", "hard"),
("Electric charge experiment.", "medium"),
("Termite study passage.", "medium"),
("Cancer treatment discussion.", "medium"),
("Fluid energy passage.", "hard"),
("Earth/Europa radius problem.", "medium")
]


def create_dataset_from_db():
    """
    Reads questions from your PostgreSQL DB and combines with bootstrap examples.
    Requires psycopg2: pip install psycopg2-binary
    """
    try:
        import psycopg2
        import os

        # Load from environment or hardcode for local use
        db_url = os.environ.get(
            "DATABASE_URL",
            "postgresql://postgres:12345678@localhost:5432/smartsikchya_db"
        )
        # Convert asyncpg URL to psycopg2 URL
        db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")

        conn = psycopg2.connect(db_url)
        cur  = conn.cursor()

        cur.execute("""
            SELECT q.question_text, m.difficulty_level
            FROM questions q
            JOIN question_metadata m ON q.question_id = m.question_id
            WHERE m.difficulty_level IS NOT NULL
        """)
        db_rows = [(row[0], row[1]) for row in cur.fetchall()]
        conn.close()

        print(f"✓ Loaded {len(db_rows)} questions from database")
        return db_rows
    except Exception as e:
        print(f"⚠ Could not load from DB: {e}")
        print("  Using bootstrap examples only.")
        return []


def main():
    os.makedirs("data", exist_ok=True)

    db_examples = create_dataset_from_db()
    all_examples = db_examples + BOOTSTRAP_EXAMPLES

    # Shuffle for better training
    import random
    random.seed(42)
    random.shuffle(all_examples)

    # Split 80/20 train/validation
    split = int(len(all_examples) * 0.8)
    train = all_examples[:split]
    val   = all_examples[split:]

    # Write CSVs
    for filename, rows in [("data/train.csv", train), ("data/val.csv", val)]:
        with open(filename, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["question_text", "label"])
            writer.writerows(rows)
        print(f"✓ Written {len(rows)} rows to {filename}")

    # Stats
    from collections import Counter
    counts = Counter(label for _, label in all_examples)
    print(f"\nDataset stats: {dict(counts)}")
    print(f"Total: {len(all_examples)} examples")

    if min(counts.values()) < 20:
        print("\n⚠ WARNING: Some classes have fewer than 20 examples.")
        print("  Add more examples to data/train.csv for better accuracy.")


if __name__ == "__main__":
    main()
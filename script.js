// Get references to HTML elements used in the quiz interface
const initialStartBtn = document.getElementById("initial-start-button");
const categoryScreen = document.getElementById("category-screen");
const quizScreen = document.getElementById("quiz-screen");
const startPromptScreen = document.getElementById("start-prompt-screen");
const resultScreen = document.getElementById("score-screen");
const questionText = document.getElementById("question-text");
const answerOptions = document.getElementById("answer-options");
const feedback = document.getElementById("feedback");
const finalScore = document.getElementById("final-score");
const reviewList = document.getElementById("wrong-answers-review");
const restartBtn = document.getElementById("restart-button");
const drinkImg = document.getElementById("cocktail-image");
const categoryList = document.getElementById("category-list");
const scoreDisplay = document.getElementById("current-score");
const timerBar = document.getElementById("timer-bar");
const timerBarContainer = document.getElementById("timer-bar-container");
const loadingIndicator = document.getElementById("loading-indicator");
const loadingText = document.getElementById("loading-text");

//Initialize key variables to be used in the quiz
let quizQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let timerInterval;
let timeLeft = 15;
let userWrongAnswers = [];
let selectedCategory = "";

// Event listener for the initial start button to transition to the category selection screen
initialStartBtn.addEventListener("click", () => {
    // Most of my screen transitions work by hiding the current screen and unhiding the next screen
    startPromptScreen.classList.add("hidden");
    categoryScreen.classList.remove("hidden");
});

// Event listener for category selection- When a category is selected, the quiz starts
categoryList.addEventListener("click", async (event) => {
    if (event.target.tagName === "LI") {
        selectedCategory = event.target.dataset.category;
        categoryScreen.classList.add("hidden");
        quizScreen.classList.remove("hidden");
        score = 0;
        currentQuestionIndex = 0;
        userWrongAnswers = [];
        scoreDisplay.textContent = score;
        await startQuiz();
    }
});
// Event listener for the restart button on the results screen to bring the user back to start screen
restartBtn.addEventListener("click", () => {
    resultScreen.classList.add("hidden");
    startPromptScreen.classList.remove("hidden");
});

// Asynchronous function to fetch questions based on category, load the first question, and  log and display error on the off-chance fetching fails
async function startQuiz() {
    loadingIndicator.classList.remove("hidden");
    loadingText.textContent = "Mixing Cocktails...Fetching questions!";

    try {
        quizQuestions = await generateQuizQuestions(selectedCategory);
        loadingIndicator.classList.add("hidden");
        showQuestion();
    } catch (error) {
        console.error("Failed to load questions:", error);
        loadingText.textContent = "Failed to load questions. Please try again.";
    }
}

//function to shuffle and randomize answer options
function shuffleArray(arr) {
    return arr.sort(() => Math.random() - 0.5);
}

// Function to start and manage the countdown timer for each question
function startTimer() {
    clearInterval(timerInterval);
    timeLeft = 15;
    timerBar.style.width = "100%";
    timerBar.style.opacity = 1;
    timerBar.style.animationPlayState = 'paused'; 
    timerBar.classList.remove("low-time", "out-of-time", "shrinking");
    void timerBar.offsetWidth;
    timerBar.classList.add("shrinking");
    timerBar.style.animationDuration = `${timeLeft}s`;
    timerBar.style.animationPlayState = 'running';
    timerInterval = setInterval(() => {
        timeLeft--;

        // Show warning visuals for last 25% of time[Doesn't fully work as expected though :-( ]
        if (timeLeft <= (15 * 0.25) && timeLeft > 0) {
            timerBar.classList.add("low-time");
            if (timeLeft % 2 === 0) {
                timerBar.style.opacity = 0.5;
            } else {
                timerBar.style.opacity = 1;
            }
        } else {
             if (!timerBar.classList.contains('out-of-time')) {
                timerBar.classList.remove("low-time");
                timerBar.style.opacity = 1;
             }
        }

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerBar.classList.remove("low-time"); 
            timerBar.classList.add("out-of-time");
            timerBar.style.opacity = 1;
            timerBar.style.animationPlayState = 'paused';
            timerBar.style.width = '0%'; 
            feedback.innerText = "⏱️ Time's up!";
            disableOptions();
            setTimeout(() => {
                nextQuestion();
            }, 1500);
        }
    }, 1000);
}

// Function to display the current question and its options
function showQuestion() {
    if (quizQuestions.length === 0 || currentQuestionIndex >= quizQuestions.length) {
        return;
    }
    const q = quizQuestions[currentQuestionIndex];

    // Clear previous options and feedback
    questionText.innerText = q.text;
    answerOptions.innerHTML = "";
    feedback.innerText = "";

    // to show the corresponding question image
    drinkImg.src = q.image || '';
    drinkImg.style.display = q.image ? "block" : "none";
    timerBarContainer.classList.remove("timer-hidden");
    timerBar.style.opacity = 1;


    // Creating the answer buttons
    q.options.forEach(option => {
        const button = document.createElement("button");
        button.innerText = option;
        button.classList.add("option-button");
        button.addEventListener("click", () => {
            clearInterval(timerInterval);
            handleAnswer(option, q);
        });
        answerOptions.appendChild(button);
    });

    startTimer();
}


// Function to process the chosen answer
function handleAnswer(selected, question) {
    disableOptions();
    if (selected === question.correct) {
        feedback.innerText = "✅ Correct!";
        feedback.classList.add("correct-feedback");
        score++;
        scoreDisplay.textContent = score;
        answerOptions.querySelectorAll(".option-button").forEach(button => {
            if (button.innerText === selected) {
                button.classList.add("correct");
            }
        });
    } else {
        feedback.innerText = `❌ Wrong! ${question.explanation}`;
        feedback.classList.add("incorrect-feedback");
        userWrongAnswers.push(question);
        answerOptions.querySelectorAll(".option-button").forEach(button => {
            if (button.innerText === selected) {
                button.classList.add("incorrect");
            }
            if (button.innerText === question.correct) {
                button.classList.add("correct");
            }
        });
    }

    setTimeout(() => {
        nextQuestion();
    }, 1500);
}


// This funtion should disable all option buttons after an answer has been picked
function disableOptions() {
    answerOptions.querySelectorAll(".option-button").forEach(button => {
        button.disabled = true;
    });
}


// Function to advance to the next question or show results if the quiz is over
function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < quizQuestions.length) {
        showQuestion();
    } else {
        showResults();
    }
}


// Function to display the final results screen
function showResults() {
    quizScreen.classList.add("hidden");
    resultScreen.classList.remove("hidden");
    finalScore.innerText = `You scored ${score} out of ${quizQuestions.length}`;
    reviewList.innerHTML = "";
    userWrongAnswers.forEach(q => {
        const div = document.createElement("div");
        div.innerHTML = `<p><strong>Question:</strong> ${q.text}</p><p><strong>Correct Answer:</strong> ${q.correct}</p>`;
        reviewList.appendChild(div);
    });
    if (score >= 4 && quizQuestions.length === 5) {
        fireConfetti();
    }
}

// Asynchronous function that will generate 5 quiz questions based on the selected category
async function generateQuizQuestions(category) {
    const questions = [];

    for (let i = 0; i < 5; i++) {
        const res = await fetch("https://www.thecocktaildb.com/api/json/v1/1/random.php");
        const data = await res.json();
        const drink = data.drinks[0];

        let question = {};

        
        // Build ingredient-based question
        if (category === "ingredient") {
            const ingredients = [];
            for (let j = 1; j <= 15; j++) {
                const ing = drink[`strIngredient${j}`];
                if (ing) ingredients.push(ing);
            }
            const allIngredientsRes = await fetch("https://www.thecocktaildb.com/api/json/v1/1/list.php?i=list");
            const allIngredientsData = await allIngredientsRes.json();
            const allIngredients = allIngredientsData.drinks.map(item => item.strIngredient1);

            let incorrectIngredient;
            do {
                incorrectIngredient = allIngredients[Math.floor(Math.random() * allIngredients.length)];
            } while (ingredients.includes(incorrectIngredient));

            question = {
                text: `Which ingredient is NOT in a ${drink.strDrink}?`,
                correct: incorrectIngredient,
                options: shuffleArray([incorrectIngredient, ...ingredients.slice(0, 3)]),
                explanation: `Ingredients in ${drink.strDrink}: ${ingredients.join(", ")}`,
                image: drink.strDrinkThumb
            };
        
        // Build glassware-based question
        } else if (category === "glass") {
            const fakeGlasses = ["Highball glass", "Martini Glass", "Copper Mug", "Shot Glass", "Wine Glass"];
            const correctGlass = drink.strGlass;
            question = {
                text: `What glass is used for a ${drink.strDrink}?`,
                correct: correctGlass,
                options: shuffleArray([correctGlass, ...fakeGlasses.filter(g => g !== correctGlass).slice(0, 3)]),
                explanation: `The ${drink.strDrink} is served in a ${correctGlass}.`,
                image: drink.strDrinkThumb
            };

       // Build alcoholic vs non-alcoholic question
        } else if (category === "alcoholic") {
            const correct = drink.strAlcoholic;
            question = {
                text: `Is a ${drink.strDrink} alcoholic or non-alcoholic?`,
                correct: correct,
                options: shuffleArray(["Alcoholic", "Non alcoholic"]),
                explanation: `The ${drink.strDrink} is classified as: ${correct}.`,
                image: drink.strDrinkThumb
            };

        // Build cocktail-by-image question
        } else if (category === "image") {
            question = {
                text: `What cocktail is shown in the image?`,
                correct: drink.strDrink,
                options: shuffleArray([drink.strDrink, "Mojito", "Margarita", "Cosmopolitan"]),
                explanation: `The cocktail shown is ${drink.strDrink}.`,
                image: drink.strDrinkThumb
            };
        }
        questions.push(question);
    }
    return questions;
}


// Function to trigger a confetti effect using the Jsdeliver library[easiest way I could find to have the confetti effect after quiz completion]
function fireConfetti() {
    confetti({
        particleCount: 2000,
        spread: 360,
        origin: { y: 0.6 }
    });
}

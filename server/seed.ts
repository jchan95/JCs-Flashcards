import { storage } from "./storage";
import { log } from "./index";

const AI_FUNDAMENTALS_CARDS = [
  { term: "LLM", definition: "Large Language Model - A neural network trained on massive text datasets to understand and generate human-like text.", hint: "Think of it as a very well-read librarian who can write essays on any topic." },
  { term: "Transformer", definition: "A neural network architecture that uses self-attention mechanisms to process sequential data in parallel.", hint: "Like a team of translators who can see the whole sentence at once instead of word by word." },
  { term: "Attention", definition: "A mechanism that allows models to focus on relevant parts of input when producing output.", hint: "Like highlighting important words in a textbook while reading." },
  { term: "Token", definition: "The basic unit of text processing in LLMs, typically a word or subword piece.", hint: "Like Scrabble tiles that can be combined to form words." },
  { term: "Embedding", definition: "A dense vector representation of text that captures semantic meaning in numerical form.", hint: "Like GPS coordinates for words in meaning-space." },
  { term: "Fine-tuning", definition: "Adapting a pre-trained model to a specific task by training on task-specific data.", hint: "Like a chef learning a new cuisine after mastering the basics." },
  { term: "Prompt", definition: "The input text given to an LLM to guide its response generation.", hint: "Like the question you ask a very knowledgeable friend." },
  { term: "Context Window", definition: "The maximum amount of text an LLM can process at once, measured in tokens.", hint: "Like the size of a whiteboard - everything must fit for the model to see it." },
  { term: "Temperature", definition: "A parameter controlling randomness in LLM outputs; higher = more creative, lower = more deterministic.", hint: "Like adjusting the creativity dial on a brainstorming session." },
  { term: "Top-k Sampling", definition: "A decoding strategy that samples from the k most likely next tokens.", hint: "Like only considering the top candidates in a talent show." },
  { term: "Top-p (Nucleus) Sampling", definition: "A decoding strategy that samples from tokens whose cumulative probability reaches p.", hint: "Like picking from candidates until you have enough good options." },
  { term: "Hallucination", definition: "When an LLM generates plausible-sounding but factually incorrect information.", hint: "Like a confident storyteller who mixes up their facts." },
  { term: "RAG", definition: "Retrieval-Augmented Generation - Combining LLMs with external knowledge retrieval for more accurate responses.", hint: "Like giving the model access to a reference library while it writes." },
  { term: "Vector Database", definition: "A database optimized for storing and querying high-dimensional embedding vectors.", hint: "Like a library organized by meaning rather than alphabetically." },
  { term: "Semantic Search", definition: "Search based on meaning rather than exact keyword matching.", hint: "Like finding 'happy' when you search for 'joyful'." },
  { term: "Chain-of-Thought", definition: "Prompting technique that encourages step-by-step reasoning in LLM responses.", hint: "Like asking someone to show their work on a math problem." },
  { term: "Few-shot Learning", definition: "Providing examples in the prompt to guide the model's behavior without fine-tuning.", hint: "Like showing a few sample answers before the test." },
  { term: "Zero-shot Learning", definition: "Getting a model to perform a task without any examples, using only instructions.", hint: "Like asking someone to do something they've never seen done before." },
  { term: "RLHF", definition: "Reinforcement Learning from Human Feedback - Training models using human preference data.", hint: "Like training a dog with treats based on what humans like." },
  { term: "Constitutional AI", definition: "Training AI to follow a set of principles that guide its behavior.", hint: "Like teaching values instead of just rules." },
  { term: "Multimodal", definition: "AI systems that can process and generate multiple types of data (text, images, audio).", hint: "Like a person who can read, see, and hear all at once." },
  { term: "Vision-Language Model", definition: "Models that can understand and generate both images and text.", hint: "Like someone who can describe what they see and draw what you describe." },
  { term: "Diffusion Model", definition: "A generative model that learns to create data by reversing a gradual noising process.", hint: "Like learning to paint by watching paintings slowly fade and reversing the process." },
  { term: "Latent Space", definition: "A compressed representation space where similar concepts are close together.", hint: "Like a map where similar cities are neighbors." },
  { term: "Autoencoder", definition: "A neural network that learns to compress and reconstruct data.", hint: "Like learning to summarize and expand text." },
  { term: "GAN", definition: "Generative Adversarial Network - Two networks competing to generate realistic data.", hint: "Like a forger and detective making each other better." },
  { term: "Batch Size", definition: "The number of training examples processed together in one training step.", hint: "Like studying flashcards in groups rather than one at a time." },
  { term: "Epoch", definition: "One complete pass through the entire training dataset.", hint: "Like reading through all your notes once before an exam." },
  { term: "Learning Rate", definition: "A hyperparameter controlling how much model weights update each step.", hint: "Like the step size when climbing a hill - too big and you overshoot." },
  { term: "Gradient Descent", definition: "An optimization algorithm that iteratively adjusts parameters to minimize loss.", hint: "Like rolling downhill to find the lowest point in a valley." },
  { term: "Backpropagation", definition: "Algorithm for computing gradients by propagating errors backward through the network.", hint: "Like tracing back mistakes to see where things went wrong." },
  { term: "Overfitting", definition: "When a model performs well on training data but poorly on new data.", hint: "Like memorizing answers instead of understanding concepts." },
  { term: "Regularization", definition: "Techniques to prevent overfitting by constraining model complexity.", hint: "Like study rules that prevent cramming before exams." },
  { term: "Dropout", definition: "Randomly zeroing neurons during training to prevent co-adaptation.", hint: "Like practicing with some team members randomly absent." },
  { term: "Activation Function", definition: "A function that introduces non-linearity into neural networks.", hint: "Like a light switch that decides if a neuron fires." },
  { term: "ReLU", definition: "Rectified Linear Unit - An activation function that outputs zero for negative inputs.", hint: "Like a filter that blocks negative emotions." },
  { term: "Softmax", definition: "A function that converts raw scores to probability distribution.", hint: "Like turning test scores into percentiles." },
  { term: "Loss Function", definition: "A measure of how wrong a model's predictions are.", hint: "Like the score that tells you how far off target you are." },
  { term: "Cross-Entropy Loss", definition: "Loss function measuring difference between predicted and true probability distributions.", hint: "Like measuring surprise - lower surprise when predictions are correct." },
  { term: "Perplexity", definition: "A measure of how well a language model predicts text; lower is better.", hint: "Like measuring how confused the model is by the text." },
  { term: "BLEU Score", definition: "Metric for evaluating machine translation by comparing to human references.", hint: "Like grading a translation by how similar it is to the teacher's answer." },
  { term: "F1 Score", definition: "Harmonic mean of precision and recall, balancing both metrics.", hint: "Like a report card that considers both completeness and accuracy." },
  { term: "Precision", definition: "The fraction of positive predictions that are actually correct.", hint: "Of all the times you said yes, how often were you right?" },
  { term: "Recall", definition: "The fraction of actual positives that were correctly predicted.", hint: "Of all the times you should have said yes, how often did you?" },
  { term: "GPU", definition: "Graphics Processing Unit - Hardware accelerator ideal for parallel neural network computations.", hint: "Like having thousands of workers doing simple tasks simultaneously." },
  { term: "TPU", definition: "Tensor Processing Unit - Google's custom AI accelerator chip.", hint: "Like a GPU specifically designed for AI math." },
  { term: "Quantization", definition: "Reducing model precision (e.g., 32-bit to 8-bit) to decrease size and speed up inference.", hint: "Like compressing a photo - smaller file, slight quality loss." },
  { term: "Inference", definition: "Using a trained model to make predictions on new data.", hint: "Like taking a test after all the studying is done." },
  { term: "Latency", definition: "The time delay between input and output in a system.", hint: "Like the pause between asking a question and getting an answer." },
  { term: "Throughput", definition: "The number of operations or requests a system can handle per unit time.", hint: "Like how many customers a restaurant can serve per hour." },
  { term: "API", definition: "Application Programming Interface - A way for software to communicate with AI services.", hint: "Like a waiter who takes your order to the kitchen." },
  { term: "Chunking", definition: "Breaking large documents into smaller pieces for processing or retrieval.", hint: "Like cutting a pizza into slices so it's easier to eat." },
];

export async function seedDatabase() {
  try {
    log("Checking for seed data...", "seed");
    
    const existingSets = await storage.getAllSets();
    const hasAIFundamentals = existingSets.some(
      s => s.name === "AI Fundamentals" && s.isPublic
    );
    
    if (hasAIFundamentals) {
      log("AI Fundamentals set already exists, skipping seed", "seed");
      return;
    }
    
    log("Creating AI Fundamentals flashcard set...", "seed");
    
    const set = await storage.createSet({
      name: "AI Fundamentals",
      description: "Master essential AI and machine learning terminology with this comprehensive flashcard set covering LLMs, neural networks, training concepts, and more.",
      createdBy: null,
      isPublic: true,
    });
    
    await storage.updateSetCardCount(set.id, AI_FUNDAMENTALS_CARDS.length);
    
    const cardsToInsert = AI_FUNDAMENTALS_CARDS.map(card => ({
      setId: set.id,
      term: card.term,
      definition: card.definition,
      hint: card.hint,
    }));
    
    await storage.createCards(cardsToInsert);
    
    log(`Successfully seeded AI Fundamentals with ${AI_FUNDAMENTALS_CARDS.length} cards`, "seed");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

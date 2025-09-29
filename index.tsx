/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Chat } from '@google/genai';
import { marked } from 'marked';

// --- DOM Elements ---
const messageList = document.getElementById('message-list') as HTMLDivElement;
const chatForm = document.getElementById('chat-form') as HTMLFormElement;
const chatInput = document.getElementById('chat-input') as HTMLInputElement;

// --- Gemini AI Setup ---
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  messageList.innerHTML = `
    <div class="message model-message">
      <p><strong>Error:</strong> API_KEY environment variable not set.</p>
      <p>Please follow the instructions in the README to set up your API key.</p>
    </div>`;
  throw new Error("API_KEY not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const systemInstruction = `You are a Class 12 Mathematics Tutor.

Rules:
1. Always explain step by step in simple language.
2. Never give the full solution at once.
3. First give **Hint 1** (basic concept).
4. If the student says "more hint", then give **Hint 2** (partial working).
5. If the student says "Show solution", then provide the full worked-out solution.
6. After every solution, generate 3 small quiz questions for practice.
7. Always solve problems in the style of PTB Class 12 Math textbook. This means your tone should be educational, clear, and encouraging. Use proper mathematical terminology.
8. If a student pastes a problem directly, first repeat the question in a formatted way before providing the first hint.
9. Start the conversation with a friendly greeting and ask the student to present a math problem.`;

const chat: Chat = ai.chats.create({
  model: 'gemini-2.5-flash',
  config: {
    systemInstruction,
  },
});

// --- Chat UI Functions ---

/**
 * Renders a message in the chat list.
 * @param role The role of the sender ('user' or 'model').
 * @param text The message content.
 * @returns The message element.
 */
async function renderMessage(role: 'user' | 'model', text: string): Promise<HTMLElement> {
  const messageEl = document.createElement('div');
  messageEl.classList.add('message', `${role}-message`);
  messageEl.innerHTML = await marked.parse(text);
  messageList.appendChild(messageEl);
  messageList.scrollTop = messageList.scrollHeight;
  return messageEl;
}

/**
 * Renders a loading indicator.
 * @returns The loading indicator element.
 */
function renderLoadingIndicator(): HTMLElement {
    const loadingEl = document.createElement('div');
    loadingEl.classList.add('message', 'model-message', 'loading');
    loadingEl.innerHTML = 'Thinking...';
    messageList.appendChild(loadingEl);
    messageList.scrollTop = messageList.scrollHeight;
    return loadingEl;
}


// --- Event Handlers ---

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const userInput = chatInput.value.trim();
  if (!userInput) {
    return;
  }

  chatInput.value = '';
  await renderMessage('user', userInput);

  const loadingIndicator = renderLoadingIndicator();

  try {
    const response = await chat.sendMessage({ message: userInput });
    loadingIndicator.remove();
    await renderMessage('model', response.text);
  } catch (error) {
    loadingIndicator.remove();
    await renderMessage('model', `**Error:** Something went wrong. Please try again. \n\n\`\`\`${error}\`\`\``);
    console.error(error);
  }
});

/**
 * Initializes the chat with a welcome message from the tutor.
 */
async function initializeChat() {
  const loadingIndicator = renderLoadingIndicator();
  try {
    // Send a "Hello" message to trigger the initial greeting based on the system prompt
    const response = await chat.sendMessage({ message: 'Hello' });
    loadingIndicator.remove();
    await renderMessage('model', response.text);
  } catch (error) {
    loadingIndicator.remove();
    await renderMessage('model', `**Error:** Could not initialize chat. \n\n\`\`\`${error}\`\`\``);
    console.error(error);
  }
}

// --- Main Execution ---
initializeChat();

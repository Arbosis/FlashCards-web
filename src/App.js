// App.js
import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import './App.css';

const App = () => {
  const [flashcards, setFlashcards] = useState([]);
  const [currentCard, setCurrentCard] = useState(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [file, setFile] = useState(null);
  const [learningGoal, setLearningGoal] = useState(2);
  const [viewingProgress, setViewingProgress] = useState(false);

  useEffect(() => {
    // Load flashcards from localStorage or initialize with empty array
    const savedFlashcards = JSON.parse(localStorage.getItem('flashcards')) || [];
    if (savedFlashcards.length > 0) {
      setFlashcards(savedFlashcards);
      updateCard(savedFlashcards);
    }
  }, []);

  useEffect(() => {
    // Save flashcards to localStorage whenever they change
    localStorage.setItem('flashcards', JSON.stringify(flashcards));
  }, [flashcards]);

  const updateCard = (cards) => {
    const availableCards = cards.filter(card => card.learning_score < learningGoal);
    if (availableCards.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableCards.length);
      setCurrentCard(availableCards[randomIndex]);
      setShowTranslation(false);
    } else {
      alert('Congratulations! You have practiced all the words.');
    }
  };

  const revealTranslation = () => {
    setShowTranslation(true);
  };

  const keepPracticing = () => {
    const updatedFlashcards = flashcards.map(card =>
      card === currentCard ? { ...card, learning_score: Math.max(card.learning_score - 1, 0) } : card
    );
    setFlashcards(updatedFlashcards);
    updateCard(updatedFlashcards);
  };

  const markLearned = () => {
    const updatedFlashcards = flashcards.map(card =>
      card === currentCard ? { ...card, learning_score: learningGoal } : card
    );
    setFlashcards(updatedFlashcards);
    updateCard(updatedFlashcards);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const data = result.data;
          if (data.length > 0 && Object.keys(data[0]).length === 3) {
            const updatedFlashcards = flashcards.slice();
            data.forEach(newItem => {
              const existingIndex = updatedFlashcards.findIndex(item => item.Swedish === newItem.Swedish);
              if (existingIndex > -1) {
                updatedFlashcards[existingIndex] = { ...updatedFlashcards[existingIndex], ...newItem };
              } else {
                newItem.learning_score = 0;
                updatedFlashcards.push(newItem);
              }
            });
            setFlashcards(updatedFlashcards);
            updateCard(updatedFlashcards);
          } else {
            alert('Invalid CSV format.');
          }
        },
        error: (error) => {
          alert('Error parsing the file.');
        }
      });
      setFile(file);
    }
  };

  const handleGoalChange = (event) => {
    setLearningGoal(parseInt(event.target.value));
  };

  const handleResetProgress = () => {
    const resetFlashcards = flashcards.map(card => ({ ...card, learning_score: 0 }));
    setFlashcards(resetFlashcards);
    updateCard(resetFlashcards);
  };

  const handleViewProgress = () => {
    setViewingProgress(true);
  };

  const handleBack = () => {
    setViewingProgress(false);
  };

  const totalWords = flashcards.length;
  const wordsLeft = flashcards.filter(card => card.learning_score < learningGoal).length;

  return (
    <div className="App">
      {!viewingProgress ? (
        <>
          <div className="options-bar">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
            />
            <select value={learningGoal} onChange={handleGoalChange}>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
            </select>
            <button onClick={handleViewProgress}>View Progress</button>
            <button onClick={handleResetProgress}>Reset All Progress</button>
          </div>
          <div className="counter">
            {wordsLeft}/{totalWords}
          </div>
          <h1>{currentCard ? currentCard.Swedish : 'Upload a CSV file'}</h1>
          {showTranslation && currentCard && (
            <p>{currentCard.English} / {currentCard.Spanish}</p>
          )}
          <button onClick={revealTranslation} disabled={!currentCard}>Reveal</button>
          <button onClick={keepPracticing} disabled={!currentCard || !showTranslation}>Keep Practicing</button>
          <button onClick={markLearned} disabled={!currentCard || !showTranslation}>Learned!</button>
        </>
      ) : (
        <div className="progress-view">
          <button onClick={handleBack}>Back</button>
          <h2>Progress</h2>
          <ul>
            {flashcards.map(card => (
              <li key={card.Swedish}>
                {card.Swedish}: {((learningGoal - card.learning_score) / learningGoal * 100).toFixed(0)}%
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default App;

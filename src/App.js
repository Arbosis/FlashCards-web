// App.js
import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import './App.css';

const App = () => {
  const [flashcards, setFlashcards] = useState([]);
  const [currentCard, setCurrentCard] = useState(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [file, setFile] = useState(null);

  useEffect(() => {
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const data = result.data;
          if (data.length > 0 && Object.keys(data[0]).length === 3) {
            data.forEach(item => item.learning_score = 0);
            setFlashcards(data);
            updateCard(data);
          } else {
            alert('Invalid CSV format.');
          }
        },
        error: (error) => {
          alert('Error parsing the file.');
        }
      });
    }
  }, [file]);

  const updateCard = (cards) => {
    const availableCards = cards.filter(card => card.learning_score < 3);
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

  const markDone = () => {
    const updatedFlashcards = flashcards.map(card =>
      card === currentCard ? { ...card, learning_score: 1 } : card
    );
    setFlashcards(updatedFlashcards);
    updateCard(updatedFlashcards);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFile(file);
    }
  };

  const totalWords = flashcards.length;
  const wordsLeft = flashcards.filter(card => card.learning_score < 3).length;

  return (
    <div className="App">
      <div className="counter">
        {wordsLeft}/{totalWords}
      </div>
      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
      />
      <h1>{currentCard ? currentCard.Swedish : 'Upload a CSV file'}</h1>
      {showTranslation && currentCard && (
        <p>{currentCard.English} / {currentCard.Spanish}</p>
      )}
      <button onClick={revealTranslation} disabled={!currentCard}>Reveal</button>
      <button onClick={keepPracticing} disabled={!currentCard || !showTranslation}>Keep Practicing</button>
      <button onClick={markDone} disabled={!currentCard || !showTranslation}>Done</button>
    </div>
  );
};

export default App;

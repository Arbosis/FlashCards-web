import React, { useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse';
import './App.css';

const App = () => {
  const [flashcards, setFlashcards] = useState([]);
  const [currentCard, setCurrentCard] = useState(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [languageOptions, setLanguageOptions] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [learningGoal, setLearningGoal] = useState(3);
  const [viewingProgress, setViewingProgress] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Memoize updateCard function
  const updateCard = useCallback((cards) => {
    const availableCards = cards.filter(card => card.learning_score < learningGoal);
    if (availableCards.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableCards.length);
      setCurrentCard(availableCards[randomIndex]);
      setShowTranslation(false);
    } else {
      setCurrentCard(null);
      alert('Congratulations! You have practiced all the words.');
    }
  }, [learningGoal]);

  // Ensure learning_score is a number
  const initializeLearningScore = (data) => {
    return data.map(item => ({
      ...item,
      learning_score: isNaN(parseInt(item.learning_score, 10)) ? 0 : parseInt(item.learning_score, 10)
    }));
  };

  // Load the default cards from the defaultData file
  const loadDefaultCSV = useCallback(() => {
    fetch(process.env.PUBLIC_URL + '/defaultData.csv')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load CSV file');
        }
        return response.text();
      })
      .then(text => {
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            const data = initializeLearningScore(result.data);
            if (data.length > 0) {
              const header = Object.keys(data[0]).filter(key => key !== 'learning_score');
              const languages = header.slice(0); // Include the main language

              if (header.length > 1) {
                setFlashcards(data);
                setLanguageOptions(languages);
                setSelectedLanguage(header[0]); // Default to the first column language
                updateCard(data);
              } else {
                alert('Invalid CSV format. Expected at least 2 columns.');
              }
            } else {
              alert('Empty CSV file.');
            }
          },
          error: (error) => {
            alert('Error parsing the file.');
          }
        });
      })
      .catch(error => {
        console.error('Error loading CSV file:', error);
      });
  }, [updateCard]);

  useEffect(() => {
    const savedFlashcards = JSON.parse(localStorage.getItem('flashcards')) || [];
    const savedLearningGoal = parseInt(localStorage.getItem('learningGoal'), 10) || learningGoal;
    const savedLanguage = localStorage.getItem('selectedLanguage');

    if (savedFlashcards.length > 0) {
      const initializedFlashcards = initializeLearningScore(savedFlashcards);
      const header = Object.keys(initializedFlashcards[0]).filter(key => key !== 'learning_score');
      const languages = header.slice(0); // Include the main language

      setFlashcards(initializedFlashcards);
      setLearningGoal(savedLearningGoal);
      setLanguageOptions(languages);
      setSelectedLanguage(savedLanguage || header[0]); // Default to the first column language
      updateCard(initializedFlashcards);
    } else {
      loadDefaultCSV();
    }
  }, [loadDefaultCSV, updateCard]);

  useEffect(() => {
    localStorage.setItem('flashcards', JSON.stringify(flashcards));
    localStorage.setItem('learningGoal', learningGoal);
    if (selectedLanguage) {
      localStorage.setItem('selectedLanguage', selectedLanguage);
    }
  }, [flashcards, learningGoal, selectedLanguage]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const data = initializeLearningScore(result.data);
          if (data.length > 0) {
            const header = Object.keys(data[0]).filter(key => key !== 'learning_score');
            const languages = header.slice(0); // Include the main language

            if (header.length > 1) {
              const updatedFlashcards = flashcards.slice();
              data.forEach(newItem => {
                const existingIndex = updatedFlashcards.findIndex(item => item[header[0]] === newItem[header[0]]);
                if (existingIndex > -1) {
                  updatedFlashcards[existingIndex] = { ...updatedFlashcards[existingIndex], ...newItem };
                } else {
                  newItem.learning_score = 0;
                  updatedFlashcards.push(newItem);
                }
              });
              setFlashcards(updatedFlashcards);
              setLanguageOptions(languages);
              setSelectedLanguage(header[0]); // Default to the first column language
              updateCard(updatedFlashcards);
            } else {
              alert('Invalid CSV format. Expected at least 2 columns.');
            }
          } else {
            alert('Empty CSV file.');
          }
        },
        error: (error) => {
          alert('Error parsing the file.');
        }
      });
    }
  };

  const revealTranslation = () => {
    setShowTranslation(true);
  };

  const keepPracticing = () => {
    updateCard(flashcards);
  };

  const markLearned = () => {
    const updatedFlashcards = flashcards.map(card =>
      card === currentCard ? { ...card, learning_score: card.learning_score + 1 } : card
    );
    setFlashcards(updatedFlashcards);
    updateCard(updatedFlashcards);
  };

  const handleGoalChange = (event) => {
    setLearningGoal(parseInt(event.target.value));
  };

  const handleLanguageChange = (event) => {
    setSelectedLanguage(event.target.value);
  };

  const handleViewProgress = () => {
    setViewingProgress(true);
  };

  const handleBack = () => {
    setViewingProgress(false);
  };

  const handleResetProgress = () => {
    setShowResetConfirm(true);
  };

  const confirmResetProgress = () => {
    const resetFlashcards = flashcards.map(card => ({ ...card, learning_score: 0 }));
    setFlashcards(resetFlashcards);
    updateCard(resetFlashcards);
    setShowResetConfirm(false);
  };

  const handleDeleteAllData = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAllData = () => {
    localStorage.removeItem('flashcards');
    localStorage.removeItem('learningGoal');
    localStorage.removeItem('selectedLanguage');
    setFlashcards([]);
    setCurrentCard(null);
    setSelectedLanguage(null);
    setLanguageOptions([]);
    setLearningGoal(3);
    setShowDeleteConfirm(false);
    loadDefaultCSV(); // Load the default CSV after deleting all data
  };

  const totalWords = flashcards.length;
  const wordsLeft = flashcards.filter(card => card.learning_score < learningGoal).length;

  return (
    <div className="App">
      <div className="options-bar">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
        />
        <label>
          Learning Repetitions
          <select value={learningGoal} onChange={handleGoalChange} disabled={flashcards.length === 0}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </label>
        <select
          onChange={handleLanguageChange}
          value={selectedLanguage || ''}
          disabled={languageOptions.length === 0}
        >
          <option value="" disabled>Select Language</option>
          {languageOptions.map(lang => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>
        <button onClick={handleViewProgress} disabled={flashcards.length === 0}>View Progress</button>
        <button onClick={handleDeleteAllData}>Delete All Data</button>
      </div>
      {showDeleteConfirm && (
        <div className="confirmation-dialog">
          <p>Are you sure you want to delete all data?</p>
          <button onClick={confirmDeleteAllData}>Confirm</button>
          <button onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
        </div>
      )}
      {showResetConfirm && (
        <div className="confirmation-dialog">
          <p>Are you sure you want to reset all progress? This will set all learning scores to 0.</p>
          <button onClick={confirmResetProgress}>Confirm</button>
          <button onClick={() => setShowResetConfirm(false)}>Cancel</button>
        </div>
      )}
      {!viewingProgress ? (
        <div className="main-content">
          {flashcards.length === 0 ? (
            <h1>Load a CSV file</h1>
          ) : (
            <>
              <h1>{currentCard ? currentCard[selectedLanguage] : ''}</h1>
              {showTranslation && currentCard && (
                <p>
                  {Object.entries(currentCard).filter(([key]) => key !== selectedLanguage && key !== 'learning_score').map(([lang, translation]) => (
                    <span key={lang}>{translation} / </span>
                  ))}
                </p>
              )}
              <button onClick={revealTranslation} disabled={!currentCard}>Reveal</button>
              <button onClick={keepPracticing} disabled={!currentCard || !showTranslation}>Keep Practicing</button>
              <button onClick={markLearned} disabled={!currentCard || !showTranslation}>Learned!</button>
            </>
          )}
        </div>
      ) : (
        <div className="progress-view">
          <button onClick={handleBack}>Back</button>
          <button onClick={handleResetProgress}>Reset All Progress</button>
          <h2>Progress</h2>
          <table>
            <thead>
              <tr>
                <th>Concept</th>
                <th>Learning</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {flashcards.map(card => {
                const percentage = ((card.learning_score / learningGoal) * 100).toFixed(0);
                return (
                  <tr key={card[Object.keys(card)[0]]}>
                    <td>
                      {Object.entries(card).filter(([key]) => key !== 'learning_score').map(([lang, translation]) => (
                        <span key={lang}>{translation} / </span>
                      ))}
                    </td>
                    <td>{percentage}%</td>
                    <td>
                      <button onClick={() => setFlashcards(flashcards.map(c => c === card ? { ...c, learning_score: learningGoal } : c))}>Learned</button>
                      <button onClick={() => setFlashcards(flashcards.map(c => c === card ? { ...c, learning_score: 0 } : c))}>Keep Practicing</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div className="status-bar">
        <p>{wordsLeft}/{totalWords} words left</p>
      </div>
    </div>
  );
};

export default App;

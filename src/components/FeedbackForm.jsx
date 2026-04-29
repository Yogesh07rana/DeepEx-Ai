import React, { useState } from 'react';

export default function FeedbackForm() {
  const [feedbackValue, setFeedbackValue] = useState('');
  const [name, setName] = useState('');
  const [rating, setRating] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!feedbackValue) { alert('Please select Yes or No for the prediction.'); return; }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('rating', rating);
    formData.append('message', message);
    formData.append('prediction_correct', feedbackValue);

    try {
      await fetch('/feedback', { method: 'POST', body: formData });
      setSubmitted(true);
    } catch {
      alert('Failed to submit feedback. Please try again.');
    }
  }

  if (submitted) {
    return (
      <div style={{ marginTop: '20px', color: '#4ade80', fontSize: '15px', fontWeight: 600 }}>
        ✅ Thank you for your feedback!
      </div>
    );
  }

  return (
    <div style={{ marginTop: '30px' }}>
      <h3 style={{ fontSize: '16px', marginTop: '30px' }}>Was the prediction correct?</h3>
      <div className="feedback-grid">
        <button
          type="button"
          id="yesBtn"
          className={feedbackValue === 'yes' ? 'selected' : ''}
          onClick={() => setFeedbackValue('yes')}
        >👍 Yes</button>
        <button
          type="button"
          id="noBtn"
          className={feedbackValue === 'no' ? 'selected' : ''}
          onClick={() => setFeedbackValue('no')}
        >👎 No</button>
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Your Name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />

        <div className="star-rating">
          {[5,4,3,2,1].map(n => (
            <React.Fragment key={n}>
              <input
                type="radio"
                id={`star${n}`}
                name="rating"
                value={String(n)}
                checked={rating === String(n)}
                onChange={() => setRating(String(n))}
              />
              <label htmlFor={`star${n}`}>★</label>
            </React.Fragment>
          ))}
        </div>

        <textarea
          placeholder="Optional comments..."
          value={message}
          onChange={e => setMessage(e.target.value)}
        />
        <button type="submit" className="btn-primary">Submit Feedback</button>
      </form>
    </div>
  );
}

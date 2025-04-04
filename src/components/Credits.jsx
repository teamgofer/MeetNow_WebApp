import React, { useState, useEffect } from 'react';

import supabase from '../supabase';

const Credits = ({ user, onCreditsUpdated }) => {
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [credits, setCredits] = useState(0);
  const [purchaseAmount, setPurchaseAmount] = useState(100);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (user) {
      fetchCredits();
    }
  }, [user]);

  const fetchCredits = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setCredits(data.credits || 0);
    } catch (error) {
      console.error('Error fetching credits:', error);
      setError('Failed to load credit balance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const purchaseCredits = async e => {
    e.preventDefault();
    try {
      setPurchasing(true);
      setError(null);
      setMessage(null);

      // In a real app, you would integrate with a payment processor here
      // For this example, we'll simulate a successful purchase

      // Call the add_user_credits function
      const { data, error } = await supabase.rpc('add_user_credits', {
        user_id: user.id,
        credit_amount: purchaseAmount,
      });

      if (error) throw error;

      // Refresh the credits
      await fetchCredits();

      setMessage(`Successfully purchased ${purchaseAmount} credits!`);

      // Notify parent component if needed
      if (onCreditsUpdated) {
        onCreditsUpdated(credits + purchaseAmount);
      }
    } catch (error) {
      console.error('Error purchasing credits:', error);
      setError('Failed to purchase credits. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading credits...</div>;
  }

  if (!user) {
    return (
      <div className="error-container p-4 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-bold mb-3">Premium Features</h2>
        <p className="mb-3">Sign in or create an account to access premium features:</p>
        <ul className="list-disc pl-5 mb-4">
          <li>
            <strong>Extended Meetups:</strong> Create meetups longer than 1 hour
          </li>
          <li>
            <strong>Custom Participant Limits:</strong> Host larger gatherings
          </li>
          <li>
            <strong>Priority Listing:</strong> Make your meetups more visible
          </li>
        </ul>
        <p className="font-semibold">Unregistered users can only create free 1-hour meetups.</p>
      </div>
    );
  }

  return (
    <div className="credits-container p-4">
      <h2 className="text-2xl font-bold mb-4">Your Credits</h2>

      {error && (
        <div className="error-message bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>
      )}
      {message && (
        <div className="success-message bg-green-100 text-green-700 p-3 rounded mb-4">
          {message}
        </div>
      )}

      <div className="credits-balance bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="text-xl font-bold mb-2">Current Balance: {credits} credits</h3>
        <p className="mb-2">As a registered user, you can use credits to:</p>
        <ul className="list-disc pl-5">
          <li>
            <strong>Create Extended Meetups:</strong> While unregistered users are limited to 1-hour
            meetups, you can create meetups lasting up to 5 hours!
          </li>
          <li>
            <strong>Access Premium Features:</strong> Enhance your meetup experience with exclusive
            options
          </li>
        </ul>
      </div>

      <div className="credits-purchase bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-xl font-bold mb-3">Purchase More Credits</h3>
        <form onSubmit={purchaseCredits}>
          <div className="form-group mb-4">
            <label htmlFor="purchaseAmount" className="block mb-2 font-medium">
              Amount to Purchase
            </label>
            <select
              id="purchaseAmount"
              value={purchaseAmount}
              onChange={e => setPurchaseAmount(Number(e.target.value))}
              className="w-full p-2 border rounded"
            >
              <option value={100}>100 Credits ($1.99)</option>
              <option value={500}>500 Credits ($8.99)</option>
              <option value={1000}>1000 Credits ($15.99)</option>
              <option value={5000}>5000 Credits ($69.99)</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn-primary bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full"
            disabled={purchasing}
          >
            {purchasing ? 'Processing...' : 'Purchase Credits'}
          </button>
        </form>
      </div>

      <div className="credits-usage bg-gray-50 p-4 rounded-lg">
        <h3 className="text-xl font-bold mb-3">How Credits Work</h3>
        <div className="mb-4">
          <h4 className="font-bold text-lg">Extended Meetup Durations</h4>
          <p className="mb-2 italic">Only registered users can create meetups longer than 1 hour</p>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Duration</th>
                <th className="p-2 text-right">Credits Required</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="p-2">1 hour</td>
                <td className="p-2 text-right">Free</td>
              </tr>
              <tr className="border-t">
                <td className="p-2">2 hours</td>
                <td className="p-2 text-right">5 credits</td>
              </tr>
              <tr className="border-t">
                <td className="p-2">3 hours</td>
                <td className="p-2 text-right">10 credits</td>
              </tr>
              <tr className="border-t">
                <td className="p-2">4 hours</td>
                <td className="p-2 text-right">15 credits</td>
              </tr>
              <tr className="border-t">
                <td className="p-2">5 hours</td>
                <td className="p-2 text-right">20 credits</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div>
          <h4 className="font-bold text-lg">Coming Soon</h4>
          <ul className="list-disc pl-5">
            <li>
              <strong>Increase Participant Limit:</strong> 50 credits per 10 additional participants
            </li>
            <li>
              <strong>Featured Meetups:</strong> 100 credits to highlight your meetup
            </li>
            <li>
              <strong>Premium Themes:</strong> Customize your meetup appearance
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Credits;

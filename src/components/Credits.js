import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
            if (error)
                throw error;
            setCredits(data.credits || 0);
        }
        catch (error) {
            console.error('Error fetching credits:', error);
            setError('Failed to load credit balance. Please try again.');
        }
        finally {
            setLoading(false);
        }
    };
    const purchaseCredits = async (e) => {
        e.preventDefault();
        try {
            setPurchasing(true);
            setError(null);
            setMessage(null);
            const { data, error } = await supabase.rpc('add_user_credits', {
                user_id: user.id,
                credit_amount: purchaseAmount,
            });
            if (error)
                throw error;
            await fetchCredits();
            setMessage(`Successfully purchased ${purchaseAmount} credits!`);
            if (onCreditsUpdated) {
                onCreditsUpdated(credits + purchaseAmount);
            }
        }
        catch (error) {
            console.error('Error purchasing credits:', error);
            setError('Failed to purchase credits. Please try again.');
        }
        finally {
            setPurchasing(false);
        }
    };
    if (loading) {
        return _jsx("div", { className: "loading", children: "Loading credits..." });
    }
    if (!user) {
        return (_jsxs("div", { className: "error-container p-4 bg-blue-50 rounded-lg", children: [_jsx("h2", { className: "text-xl font-bold mb-3", children: "Premium Features" }), _jsx("p", { className: "mb-3", children: "Sign in or create an account to access premium features:" }), _jsxs("ul", { className: "list-disc pl-5 mb-4", children: [_jsxs("li", { children: [_jsx("strong", { children: "Extended Meetups:" }), " Create meetups longer than 1 hour"] }), _jsxs("li", { children: [_jsx("strong", { children: "Custom Participant Limits:" }), " Host larger gatherings"] }), _jsxs("li", { children: [_jsx("strong", { children: "Priority Listing:" }), " Make your meetups more visible"] })] }), _jsx("p", { className: "font-semibold", children: "Unregistered users can only create free 1-hour meetups." })] }));
    }
    return (_jsxs("div", { className: "credits-container p-4", children: [_jsx("h2", { className: "text-2xl font-bold mb-4", children: "Your Credits" }), error && (_jsx("div", { className: "error-message bg-red-100 text-red-700 p-3 rounded mb-4", children: error })), message && (_jsx("div", { className: "success-message bg-green-100 text-green-700 p-3 rounded mb-4", children: message })), _jsxs("div", { className: "credits-balance bg-blue-50 p-4 rounded-lg mb-6", children: [_jsxs("h3", { className: "text-xl font-bold mb-2", children: ["Current Balance: ", credits, " credits"] }), _jsx("p", { className: "mb-2", children: "As a registered user, you can use credits to:" }), _jsxs("ul", { className: "list-disc pl-5", children: [_jsxs("li", { children: [_jsx("strong", { children: "Create Extended Meetups:" }), " While unregistered users are limited to 1-hour meetups, you can create meetups lasting up to 5 hours!"] }), _jsxs("li", { children: [_jsx("strong", { children: "Access Premium Features:" }), " Enhance your meetup experience with exclusive options"] })] })] }), _jsxs("div", { className: "credits-purchase bg-gray-50 p-4 rounded-lg mb-6", children: [_jsx("h3", { className: "text-xl font-bold mb-3", children: "Purchase More Credits" }), _jsxs("form", { onSubmit: purchaseCredits, children: [_jsxs("div", { className: "form-group mb-4", children: [_jsx("label", { htmlFor: "purchaseAmount", className: "block mb-2 font-medium", children: "Amount to Purchase" }), _jsxs("select", { id: "purchaseAmount", value: purchaseAmount, onChange: e => setPurchaseAmount(Number(e.target.value)), className: "w-full p-2 border rounded", children: [_jsx("option", { value: 100, children: "100 Credits ($1.99)" }), _jsx("option", { value: 500, children: "500 Credits ($8.99)" }), _jsx("option", { value: 1000, children: "1000 Credits ($15.99)" }), _jsx("option", { value: 5000, children: "5000 Credits ($69.99)" })] })] }), _jsx("button", { type: "submit", className: "btn-primary bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full", disabled: purchasing, children: purchasing ? 'Processing...' : 'Purchase Credits' })] })] }), _jsxs("div", { className: "credits-usage bg-gray-50 p-4 rounded-lg", children: [_jsx("h3", { className: "text-xl font-bold mb-3", children: "How Credits Work" }), _jsxs("div", { className: "mb-4", children: [_jsx("h4", { className: "font-bold text-lg", children: "Extended Meetup Durations" }), _jsx("p", { className: "mb-2 italic", children: "Only registered users can create meetups longer than 1 hour" }), _jsxs("table", { className: "w-full border-collapse", children: [_jsx("thead", { children: _jsxs("tr", { className: "bg-gray-100", children: [_jsx("th", { className: "p-2 text-left", children: "Duration" }), _jsx("th", { className: "p-2 text-right", children: "Credits Required" })] }) }), _jsxs("tbody", { children: [_jsxs("tr", { className: "border-t", children: [_jsx("td", { className: "p-2", children: "1 hour" }), _jsx("td", { className: "p-2 text-right", children: "Free" })] }), _jsxs("tr", { className: "border-t", children: [_jsx("td", { className: "p-2", children: "2 hours" }), _jsx("td", { className: "p-2 text-right", children: "5 credits" })] }), _jsxs("tr", { className: "border-t", children: [_jsx("td", { className: "p-2", children: "3 hours" }), _jsx("td", { className: "p-2 text-right", children: "10 credits" })] }), _jsxs("tr", { className: "border-t", children: [_jsx("td", { className: "p-2", children: "4 hours" }), _jsx("td", { className: "p-2 text-right", children: "15 credits" })] }), _jsxs("tr", { className: "border-t", children: [_jsx("td", { className: "p-2", children: "5 hours" }), _jsx("td", { className: "p-2 text-right", children: "20 credits" })] })] })] })] }), _jsxs("div", { children: [_jsx("h4", { className: "font-bold text-lg", children: "Coming Soon" }), _jsxs("ul", { className: "list-disc pl-5", children: [_jsxs("li", { children: [_jsx("strong", { children: "Increase Participant Limit:" }), " 50 credits per 10 additional participants"] }), _jsxs("li", { children: [_jsx("strong", { children: "Featured Meetups:" }), " 100 credits to highlight your meetup"] }), _jsxs("li", { children: [_jsx("strong", { children: "Premium Themes:" }), " Customize your meetup appearance"] })] })] })] })] }));
};
export default Credits;
//# sourceMappingURL=Credits.js.map
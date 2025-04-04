import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import supabase from '../utils/supabase';
function Page() {
    const [todos, setTodos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        async function getTodos() {
            try {
                setIsLoading(true);
                const { data, error } = await supabase.from('todos').select('*');
                if (error) {
                    throw error;
                }
                if (data && data.length > 0) {
                    setTodos(data);
                }
            }
            catch (error) {
                console.error('Error fetching todos:', error);
                setError('Failed to fetch todos');
            }
            finally {
                setIsLoading(false);
            }
        }
        getTodos();
    }, []);
    return (_jsxs("div", { className: "p-6 max-w-md mx-auto bg-white rounded-xl shadow-md", children: [_jsx("h1", { className: "text-2xl font-bold mb-4", children: "Todo List" }), isLoading && (_jsx("div", { className: "flex justify-center my-4", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" }) })), error && (_jsx("div", { className: "bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4", children: error })), !isLoading && todos.length === 0 && !error && (_jsx("p", { className: "text-gray-500", children: "No todos found." })), _jsx("ul", { className: "space-y-2", children: todos.map(todo => (_jsx("li", { className: "p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center", children: _jsx("span", { className: todo.completed ? 'line-through text-gray-400' : '', children: todo.title }) }, todo.id))) })] }));
}
export default Page;
//# sourceMappingURL=app.js.map
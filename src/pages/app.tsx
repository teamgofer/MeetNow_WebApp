import { useState, useEffect } from 'react'
import supabase from '../utils/supabase'

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

function Page() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function getTodos() {
      try {
        setIsLoading(true)
        const { data, error } = await supabase.from('todos').select('*')

        if (error) {
          throw error
        }

        if (data && data.length > 0) {
          setTodos(data)
        }
      } catch (error) {
        console.error('Error fetching todos:', error)
        setError('Failed to fetch todos')
      } finally {
        setIsLoading(false)
      }
    }

    getTodos()
  }, [])

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-bold mb-4">Todo List</h1>
      
      {isLoading && (
        <div className="flex justify-center my-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {!isLoading && todos.length === 0 && !error && (
        <p className="text-gray-500">No todos found.</p>
      )}

      <ul className="space-y-2">
        {todos.map((todo) => (
          <li 
            key={todo.id} 
            className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center"
          >
            <span className={todo.completed ? 'line-through text-gray-400' : ''}>
              {todo.title}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Page
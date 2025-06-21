// TodoShowcase component to demonstrate todo UI components
import { useState } from 'react';
import { TodoItem } from './TodoItem';
import { TodoList } from './TodoList';
import type { Todo } from '../../types/todo';

const mockTodos: Todo[] = [
  {
    id: '1',
    title: 'Buy groceries for the week',
    description: 'Get vegetables, fruits, and dairy products',
    completed: false,
    priority: 'high',
    assignedTo: 'mpaz',
    createdBy: 'user123',
    createdAt: new Date(),
    updatedAt: new Date(),
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    tags: ['shopping', 'weekly'],
  },
  {
    id: '2',
    title: 'Schedule dentist appointment',
    completed: false,
    priority: 'medium',
    assignedTo: 'gonzalo',
    createdBy: 'user123',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    updatedAt: new Date(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
    tags: ['health'],
  },
  {
    id: '3',
    title: 'Complete homework',
    description: 'Math exercises pages 45-48',
    completed: false,
    priority: 'high',
    assignedTo: 'borja',
    createdBy: 'user123',
    createdAt: new Date(),
    updatedAt: new Date(),
    dueDate: new Date(), // Today (overdue)
    tags: ['school'],
  },
  {
    id: '4',
    title: 'Water the plants',
    completed: true,
    priority: 'low',
    assignedTo: 'melody',
    createdBy: 'user123',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    completedAt: new Date(),
    tags: ['home'],
  },
  {
    id: '5',
    title: 'Prepare presentation for work',
    description: 'Review slides and practice speech',
    completed: true,
    priority: 'high',
    assignedTo: 'gonzalo',
    createdBy: 'user123',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    tags: ['work', 'important'],
  },
];

export const TodoShowcase = () => {
  const [todos, setTodos] = useState<Todo[]>(mockTodos);

  const handleToggleComplete = (id: string) => {
    setTodos(prevTodos =>
      prevTodos.map(todo =>
        todo.id === id
          ? {
              ...todo,
              completed: !todo.completed,
              completedAt: !todo.completed ? new Date() : null,
              updatedAt: new Date(),
            }
          : todo
      )
    );
  };

  const handleEdit = (todo: Todo) => {
    console.log('Edit todo:', todo);
  };

  const handleDelete = (id: string) => {
    setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
  };

  const handleAssign = (id: string, assignedTo: any) => {
    setTodos(prevTodos =>
      prevTodos.map(todo =>
        todo.id === id
          ? { ...todo, assignedTo, updatedAt: new Date() }
          : todo
      )
    );
  };

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Todo Components Showcase</h1>
        <p className="text-gray-600 mb-8">
          Examples of todo item and list components with different states and configurations.
        </p>
      </div>

      {/* Individual Todo Items */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Individual Todo Items</h2>
        
        <div className="space-y-6">
          {/* Standard todo item */}
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Standard Todo Item</h3>
            <TodoItem
              todo={todos[0]}
              onToggleComplete={handleToggleComplete}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAssign={handleAssign}
            />
          </div>

          {/* Compact todo item */}
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Compact Todo Item</h3>
            <TodoItem
              todo={todos[1]}
              onToggleComplete={handleToggleComplete}
              onEdit={handleEdit}
              onDelete={handleDelete}
              compact
            />
          </div>

          {/* Overdue todo item */}
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Overdue Todo Item</h3>
            <TodoItem
              todo={todos[2]}
              onToggleComplete={handleToggleComplete}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>

          {/* Completed todo item */}
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Completed Todo Item</h3>
            <TodoItem
              todo={todos[3]}
              onToggleComplete={handleToggleComplete}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        </div>
      </section>

      {/* Todo List */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Todo List</h2>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <TodoList
            todos={todos}
            onToggleComplete={handleToggleComplete}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAssign={handleAssign}
          />
        </div>
      </section>

      {/* Empty State */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Empty State</h2>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <TodoList
            todos={[]}
            onToggleComplete={handleToggleComplete}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </section>

      {/* Loading State */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Loading State</h2>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <TodoList
            todos={[]}
            loading={true}
            onToggleComplete={handleToggleComplete}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </section>

      {/* Error State */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Error State</h2>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <TodoList
            todos={[]}
            error="Failed to load todos. Please try again."
            onToggleComplete={handleToggleComplete}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </section>
    </div>
  );
};
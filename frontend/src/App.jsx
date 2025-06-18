// Local: frontend/src/App.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Menu, X, Plus, PieChart as PieChartIcon, List, Edit2, Trash2 } from 'lucide-react';

// --- Constantes ---
const API_BASE_URL = '/api'; // O proxy do Vite vai redirecionar
const POMODORO_TIME = 25 * 60;
const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1943'];

// --- Componentes da UI ---

const Sidebar = ({ currentView, setCurrentView, isOpen, setIsOpen }) => {
    const navItems = [
        { id: 'dashboard', icon: PieChartIcon, label: 'Dashboard' },
        { id: 'tasks', icon: List, label: 'Tarefas' },
        { id: 'manage', icon: Plus, label: 'Gerenciar' },
    ];

    const NavLink = ({ item }) => (
        <button
            onClick={() => {
                setCurrentView(item.id);
                setIsOpen(false); // Fecha o menu no mobile ao clicar
            }}
            className={`flex items-center w-full px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
                currentView === item.id 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-200 hover:bg-blue-800 hover:text-white'
            }`}
        >
            <item.icon className="w-5 h-5 mr-3" />
            <span>{item.label}</span>
        </button>
    );

    return (
        <>
            {/* Overlay para fechar o menu no mobile */}
            <div 
                className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsOpen(false)}
            ></div>
            
            {/* Sidebar */}
            <aside className={`fixed top-0 left-0 h-full bg-blue-900 text-white w-64 p-4 transform transition-transform duration-300 ease-in-out z-40 lg:static lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <h1 className="text-2xl font-bold mb-8">TodoApp</h1>
                <nav className="flex flex-col space-y-2">
                    {navItems.map(item => <NavLink key={item.id} item={item} />)}
                </nav>
            </aside>
        </>
    );
};

const PomodoroTimer = ({ task, onTimeUpdate }) => {
    const [timeLeft, setTimeLeft] = useState(POMODORO_TIME);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
        } else if (timeLeft === 0 && isActive) {
            clearInterval(interval);
            setIsActive(false);
            onTimeUpdate(task.id, task.pomodoro_time_spent + POMODORO_TIME);
            alert(`Sessão Pomodoro para "${task.title}" concluída!`);
            setTimeLeft(POMODORO_TIME);
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, task, onTimeUpdate]);

    const toggle = () => setIsActive(!isActive);
    const reset = () => {
        setIsActive(false);
        setTimeLeft(POMODORO_TIME);
    };

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <div className="flex items-center gap-2">
            <span className="font-mono text-sm bg-gray-200 text-gray-800 px-2 py-1 rounded">{`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`}</span>
            <button onClick={toggle} className={`px-2 py-1 text-xs text-white rounded ${isActive ? 'bg-yellow-500' : 'bg-green-500'}`}>
                {isActive ? 'Pausar' : 'Iniciar'}
            </button>
            <button onClick={reset} className="px-2 py-1 text-xs bg-gray-500 text-white rounded">Resetar</button>
        </div>
    );
};

const CategoryChart = ({ data }) => {
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg text-gray-500">Complete sessões Pomodoro para ver o gráfico.</div>;
    }
    return (
        <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4 text-center">Tempo por Categoria (minutos)</h3>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                        {data.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value) => `${value.toFixed(2)} min`} />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};


// --- Views (Telas) ---

const DashboardView = ({ tasks }) => {
    const chartData = useMemo(() => {
        // CORREÇÃO: Adiciona uma verificação para garantir que 'tasks' é um array.
        if (!Array.isArray(tasks)) return [];

        const timeByCat = tasks.reduce((acc, task) => {
            acc[task.category_name] = (acc[task.category_name] || 0) + task.pomodoro_time_spent;
            return acc;
        }, {});
        return Object.entries(timeByCat).filter(([, time]) => time > 0).map(([name, time]) => ({ name, value: time / 60 }));
    }, [tasks]);

    // CORREÇÃO: Verificações também adicionadas aqui.
    const totalTime = useMemo(() => Array.isArray(tasks) ? tasks.reduce((sum, task) => sum + task.pomodoro_time_spent, 0) / 60 : 0, [tasks]);
    const completedTasks = useMemo(() => Array.isArray(tasks) ? tasks.filter(t => t.completed).length : 0, [tasks]);
    const totalTasks = useMemo(() => Array.isArray(tasks) ? tasks.length : 0, [tasks]);

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow-md text-center">
                    <h3 className="text-lg font-semibold text-gray-600">Total de Tarefas</h3>
                    <p className="text-4xl font-bold text-blue-600">{totalTasks}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md text-center">
                    <h3 className="text-lg font-semibold text-gray-600">Tarefas Concluídas</h3>
                    <p className="text-4xl font-bold text-green-600">{completedTasks}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md text-center">
                    <h3 className="text-lg font-semibold text-gray-600">Tempo Focado (min)</h3>
                    <p className="text-4xl font-bold text-purple-600">{totalTime.toFixed(0)}</p>
                </div>
            </div>
            <CategoryChart data={chartData} />
        </div>
    );
};

const TasksView = ({ tasks, onToggle, onDelete, onPomodoroUpdate }) => {
    // CORREÇÃO: Adiciona uma verificação de segurança aqui também.
    const taskList = Array.isArray(tasks) ? tasks : [];

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Lista de Tarefas</h2>
            <div className="bg-white p-4 rounded-lg shadow-md">
                <ul className="divide-y divide-gray-200">
                    {taskList.length > 0 ? taskList.map(task => (
                        <li key={task.id} className={`p-4 flex flex-col md:flex-row md:items-center gap-4 ${task.completed ? 'bg-green-50' : ''}`}>
                            <div className="flex-grow flex items-center gap-4">
                                <input type="checkbox" checked={task.completed} onChange={() => onToggle(task)} className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                <div className={task.completed ? 'text-gray-500 line-through' : ''}>
                                    <p className="font-semibold">{task.title}</p>
                                    <span className="text-xs text-white bg-blue-500 px-2 py-1 rounded-full">{task.category_name}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                {!task.completed && <PomodoroTimer task={task} onTimeUpdate={onPomodoroUpdate} />}
                                <button onClick={() => onDelete(task.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={18} /></button>
                            </div>
                        </li>
                    )) : <p className="text-center text-gray-500 p-8">Nenhuma tarefa encontrada. Adicione uma na tela "Gerenciar".</p>}
                </ul>
            </div>
        </div>
    );
};

const ManageView = ({ categories, onAddTask, onAddCategory }) => {
    const [taskTitle, setTaskTitle] = useState('');
    const [taskCategory, setTaskCategory] = useState(categories[0]?.id || '');
    const [categoryName, setCategoryName] = useState('');
    
    useEffect(() => {
        if (!taskCategory && categories.length > 0) {
            setTaskCategory(categories[0].id);
        }
    }, [categories, taskCategory]);

    const handleTaskSubmit = (e) => {
        e.preventDefault();
        onAddTask({ title: taskTitle, category_id: taskCategory });
        setTaskTitle('');
    };

    const handleCategorySubmit = (e) => {
        e.preventDefault();
        onAddCategory({ name: categoryName });
        setCategoryName('');
    };

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Gerenciar</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold mb-4">Adicionar Nova Tarefa</h3>
                    <form onSubmit={handleTaskSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="task-title" className="block text-sm font-medium text-gray-700">Título</label>
                            <input type="text" id="task-title" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                        </div>
                        <div>
                            <label htmlFor="task-category" className="block text-sm font-medium text-gray-700">Categoria</label>
                            <select id="task-category" value={taskCategory} onChange={e => setTaskCategory(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                            </select>
                        </div>
                        <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">Adicionar Tarefa</button>
                    </form>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold mb-4">Criar Nova Categoria</h3>
                    <form onSubmit={handleCategorySubmit} className="space-y-4">
                        <div>
                            <label htmlFor="category-name" className="block text-sm font-medium text-gray-700">Nome da Categoria</label>
                            <input type="text" id="category-name" value={categoryName} onChange={e => setCategoryName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                        </div>
                        <button type="submit" className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors">Criar Categoria</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

// --- Componente Principal ---
function App() {
    const [tasks, setTasks] = useState([]);
    const [categories, setCategories] = useState([]);
    const [error, setError] = useState('');
    const [currentView, setCurrentView] = useState('dashboard'); // dashboard, tasks, manage
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setError('');
            const [tasksRes, categoriesRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/tasks`),
                axios.get(`${API_BASE_URL}/categories`)
            ]);
            setTasks(tasksRes.data);
            setCategories(categoriesRes.data);
        } catch (err) {
            setError('Falha ao buscar dados do servidor.');
            console.error(err);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleApiCall = async (apiCall) => {
        try {
            setError('');
            await apiCall();
            await fetchData();
        } catch (err) {
            const errorMessage = err.response?.data?.error || `Falha na operação: ${err.message}`;
            setError(errorMessage);
            console.error(err);
        }
    };
    
    const addTask = (taskData) => handleApiCall(() => axios.post(`${API_BASE_URL}/tasks`, taskData));
    const addCategory = (catData) => handleApiCall(() => axios.post(`${API_BASE_URL}/categories`, catData));
    const deleteTask = (id) => handleApiCall(() => axios.delete(`${API_BASE_URL}/tasks/${id}`));
    const toggleTask = (task) => handleApiCall(() => axios.put(`${API_BASE_URL}/tasks/${task.id}`, { completed: !task.completed }));
    const updatePomodoro = (id, time) => handleApiCall(() => axios.put(`${API_BASE_URL}/tasks/${id}`, { pomodoro_time_spent: time }));

    const renderView = () => {
        switch (currentView) {
            case 'tasks':
                return <TasksView tasks={tasks} onToggle={toggleTask} onDelete={deleteTask} onPomodoroUpdate={updatePomodoro} />;
            case 'manage':
                return <ManageView categories={categories} onAddTask={addTask} onAddCategory={addCategory} />;
            case 'dashboard':
            default:
                return <DashboardView tasks={tasks} />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar currentView={currentView} setCurrentView={setCurrentView} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex items-center justify-between p-4 bg-white border-b lg:hidden">
                    <button onClick={() => setIsSidebarOpen(true)}>
                        <Menu className="h-6 w-6 text-gray-600" />
                    </button>
                    <h1 className="text-xl font-bold text-blue-800">{currentView.charAt(0).toUpperCase() + currentView.slice(1)}</h1>
                </header>
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-8">
                    {error && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
                            <p className="font-bold">Erro</p>
                            <p>{error}</p>
                        </div>
                    )}
                    {renderView()}
                </main>
            </div>
        </div>
    );
}

export default App;

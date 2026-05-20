import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faExclamationTriangle,
    faChevronDown,
    faSignOutAlt,
    faBuilding,
    faFilter,
    faTrophy,
    faSync,
    faUserTie,
    faChartBar,
    faCaretRight,
    faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import BASE_URL from '../config';

const graphData = {
    Weekly: [
        { name: 'Mon', reworks: 12 },
        { name: 'Tue', reworks: 19 },
        { name: 'Wed', reworks: 15 },
        { name: 'Thu', reworks: 22 },
        { name: 'Fri', reworks: 30 },
        { name: 'Sat', reworks: 25 },
        { name: 'Sun', reworks: 10 },
    ],
    Monthly: [
        { name: 'Jan', reworks: 120 },
        { name: 'Feb', reworks: 150 },
        { name: 'Mar', reworks: 180 },
        { name: 'Apr', reworks: 140 },
        { name: 'May', reworks: 200 },
        { name: 'Jun', reworks: 170 },
        { name: 'Jul', reworks: 190 },
        { name: 'Aug', reworks: 210 },
        { name: 'Sep', reworks: 160 },
        { name: 'Oct', reworks: 220 },
        { name: 'Nov', reworks: 190 },
        { name: 'Dec', reworks: 240 },
    ],
    Yearly: [
        { name: '2021', reworks: 1200 },
        { name: '2022', reworks: 1500 },
        { name: '2023', reworks: 1800 },
        { name: '2024', reworks: 2100 },
        { name: '2025', reworks: 1900 },
    ]
};

const HODDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [summary, setSummary] = useState({ totalReworks: 0, totalReworkItems: 0, projectWise: [] });
    const [selectedProject, setSelectedProject] = useState('All Projects');
    const [filterStatus, setFilterStatus] = useState('All'); // New: All/Open/Closed
    const [startDate, setStartDate] = useState(''); // New: From Date
    const [endDate, setEndDate] = useState(''); // New: To Date
    const [projectDetails, setProjectDetails] = useState(null);
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false); // New: Custom dropdown state
    const [loading, setLoading] = useState(true);
    const [expandedCategory, setExpandedCategory] = useState(null);
    const [graphTimeframe, setGraphTimeframe] = useState('Monthly');

    // Auth Check
    useEffect(() => {
        const storedUser = localStorage.getItem('nyati_user');
        if (!storedUser) {
            navigate('/');
        } else {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser.role !== 'HOD') {
                navigate('/');
            } else {
                setUser(parsedUser);
            }
        }
    }, [navigate]);

    const fetchSummary = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            params.append('status', filterStatus);
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const res = await axios.get(`${BASE_URL}/api/hod/rework-summary?${params.toString()}`);
            setSummary(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Summary fetch error", err);
        }
    }, [filterStatus, startDate, endDate]);

    const fetchProjectDetails = useCallback(async (projectName) => {
        if (projectName === 'All Projects') {
            setProjectDetails(null);
            return;
        }
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('project', projectName);
            params.append('status', filterStatus);
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const res = await axios.get(`${BASE_URL}/api/hod/project-reworks?${params.toString()}`);
            setProjectDetails(res.data);
        } catch (err) {
            console.error("Project detail fetch error", err);
        } finally {
            setLoading(false);
        }
    }, [filterStatus, startDate, endDate]);

    // Initial Fetch & Interval
    useEffect(() => {
        fetchSummary();
        const interval = setInterval(() => {
            fetchSummary();
        }, 60000);
        return () => clearInterval(interval);
    }, [fetchSummary]);

    const handleProjectChange = (name) => {
        setSelectedProject(name);
        setExpandedCategory(null);
    };

    // Effect to refetch summary/details when filters change
    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    useEffect(() => {
        if (selectedProject !== 'All Projects') {
            fetchProjectDetails(selectedProject);
        } else {
            setProjectDetails(null);
        }
    }, [selectedProject, fetchProjectDetails]);

    const handleLogout = () => {
        localStorage.removeItem('nyati_user');
        navigate('/');
    };

    if (!user) return null;

    const projectsAffected = summary.projectWise.length;
    const mostCritical = summary.projectWise[0]?.projectName || "N/A";

    return (
        <div className="min-h-screen bg-gray-50 pb-12 font-sans text-gray-800">
            {/* STICKY HEADER */}
            <header className="sticky top-0 z-50 bg-[#004080] text-white shadow-md">
                <div className="max-w-full mx-auto px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="Logo" className="h-10" />
                        <h1 className="text-xl font-bold tracking-tight">HOD Dashboard</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-xs opacity-75 font-medium">Logged in as</span>
                            <span className="text-base font-bold">{user.fullName}</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 bg-white/10 hover:bg-red-500 hover:border-red-400 px-4 py-2 rounded-lg transition-all duration-200 border border-white/20 text-sm font-bold tracking-wide"
                        >
                            <FontAwesomeIcon icon={faSignOutAlt} className="text-xs" />
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-full mx-auto px-8 mt-8 space-y-8">

                {/* STATS & GRID ROW */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                    {/* LEFT SIDEBAR: STATS CARDS */}
                    <div className="lg:col-span-1 flex flex-col gap-4">
                        {/* TOTAL REWORKS */}
                        <div className="bg-red-50 p-6 rounded-3xl border border-red-100 flex items-center justify-between 
        transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Reworks</p>
                                <h2 className="text-3xl font-black text-red-600 mt-1">{summary.totalReworks}</h2>
                            </div>
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-red-600 text-xl shadow-sm border border-red-50">
                                <FontAwesomeIcon icon={faExclamationTriangle} />
                            </div>
                        </div>

                        {/* PROJECTS AFFECTED */}
                        <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-center justify-between 
        transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Projects Affected</p>
                                <h2 className="text-3xl font-black text-blue-700 mt-1">{projectsAffected}</h2>
                            </div>
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-700 text-xl shadow-sm border border-blue-50">
                                <FontAwesomeIcon icon={faBuilding} />
                            </div>
                        </div>

                        {/* MOST CRITICAL */}
                        <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 flex items-center justify-between 
        transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Most Critical</p>
                                <h2 className="text-xl font-black text-orange-600 mt-2 truncate">
                                    {mostCritical}
                                </h2>
                            </div>
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-600 text-xl shadow-sm border border-orange-50 shrink-0">
                                <FontAwesomeIcon icon={faTrophy} />
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDE: REWORK TREND GRAPH */}
                    <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-lg font-black text-gray-800">Rework Analysis</h3>
                                <p className="text-xs text-gray-400 font-medium">Trend over {graphTimeframe.toLowerCase()}</p>
                            </div>
                            <div className="relative">
                                <select
                                    className="appearance-none bg-gray-50 border border-gray-200 text-xs font-bold rounded-xl px-4 py-2 pr-10 outline-none focus:ring-2 focus:ring-[#004080]/20 transition cursor-pointer"
                                    value={graphTimeframe}
                                    onChange={(e) => setGraphTimeframe(e.target.value)}
                                >
                                    <option value="Weekly">Weekly</option>
                                    <option value="Monthly">Monthly</option>
                                    <option value="Yearly">Yearly</option>
                                </select>
                                <FontAwesomeIcon icon={faChevronDown} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[10px]" />
                            </div>
                        </div>

                        <div className="flex-1 min-h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={graphData[graphTimeframe]}>
                                    <defs>
                                        <linearGradient id="colorRework" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="reworks"
                                        stroke="#6366f1"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorRework)"
                                        animationDuration={1500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>

                {/* FILTER SECTION */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* 1. Project Filter */}
                        <div>
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">Project</label>
                            <div className="relative group">
                                <select
                                    className="appearance-none bg-gray-50 border border-gray-200 text-sm font-bold rounded-xl px-4 py-3 pr-10 outline-none focus:ring-2 focus:ring-[#004080]/20 focus:border-[#004080] transition w-full cursor-pointer"
                                    value={selectedProject}
                                    onChange={(e) => handleProjectChange(e.target.value)}
                                >
                                    <option value="All Projects">All Projects</option>
                                    {summary.projectWise.map(p => (
                                        <option key={p.projectName} value={p.projectName}>{p.projectName}</option>
                                    ))}
                                </select>
                                <FontAwesomeIcon icon={faChevronDown} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs" />
                            </div>
                        </div>

                        {/* 2. Custom Status Dropdown with Radios */}
                        <div className="relative">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">Status Filter</label>
                            <button
                                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                                className="flex items-center justify-between bg-gray-50 border border-gray-200 text-sm font-bold rounded-xl px-4 py-3 w-full hover:border-[#004080] transition group shadow-sm"
                            >
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${filterStatus === 'All' ? 'bg-blue-500' : filterStatus === 'Open' ? 'bg-red-500' : 'bg-green-500'}`}></span>
                                    <span>{filterStatus === 'Closed' ? 'Closed / Approved' : filterStatus === 'Open' ? 'Open Reworks' : 'All Reworks'}</span>
                                </div>
                                <FontAwesomeIcon icon={faChevronDown} className={`text-gray-400 transition-transform duration-200 ${statusDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {statusDropdownOpen && (
                                <>
                                    {/* Backdrop to close */}
                                    <div className="fixed inset-0 z-10" onClick={() => setStatusDropdownOpen(false)}></div>

                                    {/* Dropdown Menu */}
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top">
                                        {['All', 'Open', 'Closed'].map((s) => (
                                            <div
                                                key={s}
                                                onClick={() => {
                                                    setFilterStatus(s);
                                                    setStatusDropdownOpen(false);
                                                }}
                                                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                                            >
                                                {/* Custom Radio Button UI */}
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${filterStatus === s ? 'border-[#004080]' : 'border-gray-200'}`}>
                                                    {filterStatus === s && <div className="w-3 h-3 rounded-full bg-[#004080]"></div>}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${s === 'All' ? 'bg-blue-500' : s === 'Open' ? 'bg-red-500' : 'bg-green-500'}`}></span>
                                                    <span className={`text-sm font-bold ${filterStatus === s ? 'text-[#004080]' : 'text-gray-600'}`}>
                                                        {s === 'All' ? 'All Reworks' : s === 'Open' ? 'Open Reworks' : 'Closed / Approved'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* 3. From Date */}
                        <div>
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">From Date</label>
                            <input
                                type="date"
                                className="bg-gray-50 border border-gray-200 text-sm font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#004080]/20 focus:border-[#004080] transition w-full"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>

                        {/* 4. To Date */}
                        <div>
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">To Date</label>
                            <input
                                type="date"
                                className="bg-gray-50 border border-gray-200 text-sm font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#004080]/20 focus:border-[#004080] transition w-full"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Reset Button */}
                    {(startDate || endDate || filterStatus !== 'All' || selectedProject !== 'All Projects') && (
                        <button
                            onClick={() => {
                                setSelectedProject('All Projects');
                                setFilterStatus('All');
                                setStartDate('');
                                setEndDate('');
                            }}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-500 text-[10px] font-bold uppercase px-4 py-2.5 rounded-xl transition-all"
                        >
                            Reset
                        </button>
                    )}
                </div>

                {/* MAIN TABLE SECTION */}
                {!projectDetails ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                            <h3 className="font-black text-gray-400 text-xs uppercase tracking-widest flex items-center gap-2">
                                <FontAwesomeIcon icon={faChartBar} /> Projects
                            </h3>
                            <button onClick={fetchSummary} className="text-primary text-sm font-bold hover:underline flex items-center gap-1">
                                <FontAwesomeIcon icon={faSync} className={loading ? 'animate-spin' : ''} /> Refresh
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50 text-xs font-bold text-gray-400 uppercase border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 w-16">Sr.No.</th>
                                        <th className="px-6 py-3">Project Name</th>
                                        <th className="px-6 py-3">Total Reworks</th>
                                        <th className="px-6 py-3 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {summary.projectWise.map((p, idx) => {
                                        const isCritical = p.reworkCount > 10;
                                        const isHigh = p.reworkCount > 5;
                                        return (
                                            <tr
                                                key={p.projectName}
                                                onClick={() => handleProjectChange(p.projectName)}
                                                className={`group cursor-pointer hover:bg-gray-50/80 transition ${idx === 0 ? 'bg-red-50/30 border-l-4 border-red-500' : ''}`}
                                            >
                                                <td className="px-6 py-4">
                                                    <span className={`w-6 h-6 flex items-center justify-center rounded-full font-bold text-[10px] ${idx === 0 ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                        {idx + 1}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-base text-[#004080] group-hover:underline">{p.projectName}</span>
                                                        <span className="text-xs text-gray-400">{p.siteName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-black">{p.reworkCount}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-tighter 
                                                        ${p.status === 'Approved' ? 'bg-green-100 text-green-600' :
                                                            isCritical ? 'bg-red-100 text-red-600' :
                                                                isHigh ? 'bg-orange-100 text-orange-600' :
                                                                    'bg-yellow-100 text-yellow-600'
                                                        }`}>
                                                        {p.status === 'Approved' ? 'COMPLETED' :
                                                            isCritical ? 'CRITICAL' : isHigh ? 'HIGH' : 'MODERATE'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {summary.projectWise.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-12 text-center text-gray-400 italic">No project reworks found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                            <h2 className="font-black text-primary flex items-center gap-2">
                                <FontAwesomeIcon icon={faCaretRight} className="text-accent" />
                                Rework Breakdown: {selectedProject}
                            </h2>
                            <button
                                onClick={() => handleProjectChange('All Projects')}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-primary hover:text-white text-gray-500 transition-all duration-200"
                                title="Back to All Projects"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                            </button>
                        </div>

                        {/* ACCORDION LIST */}
                        <div className="space-y-3">
                            {projectDetails.categoryWise.map((cat, idx) => (
                                <div key={cat.category} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                    <button
                                        onClick={() => setExpandedCategory(expandedCategory === cat.category ? null : cat.category)}
                                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-lg flex items-center justify-center font-bold text-sm">{idx + 1}</span>
                                            <span className="font-bold text-base">{cat.category}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="bg-gray-100 text-gray-500 text-xs font-black px-3 py-1.5 rounded-full">{cat.reworkCount} REWORKS</span>
                                            <div className="w-7 h-7 flex items-center justify-center rounded-md bg-gray-100 group-hover:bg-gray-200 transition-colors">
                                                <FontAwesomeIcon
                                                    icon={faChevronDown}
                                                    className="text-gray-500 transition-transform duration-300 text-xs"
                                                    style={{ transform: expandedCategory === cat.category ? 'rotate(0deg)' : 'rotate(180deg)' }}
                                                />
                                            </div>
                                        </div>
                                    </button>

                                    {expandedCategory === cat.category && (
                                        <div className="border-t border-gray-50 overflow-x-auto transition-all duration-300">
                                            <table className="w-full text-xs">
                                                <thead className="bg-gray-50 shadow-inner">
                                                    <tr className="text-gray-400 font-bold uppercase tracking-tighter">
                                                        <th className="px-4 py-2 border-r border-gray-100 italic">#</th>
                                                        <th className="px-4 py-2 border-r border-gray-100">Checkpoint Question</th>
                                                        <th className="px-4 py-2 border-r border-gray-100">Location</th>
                                                        <th className="px-4 py-2 border-r border-gray-100">Engineer</th>
                                                        <th className="px-4 py-2 border-r border-gray-100 uppercase tracking-tighter">QE Name</th>
                                                        <th className="px-4 py-2 border-r border-gray-100 uppercase tracking-tighter">Opening Date</th>
                                                        <th className="px-4 py-2 border-r border-gray-100 uppercase tracking-tighter">Closing Date</th>
                                                        <th className="px-4 py-2 border-r border-gray-100 uppercase tracking-tighter">QE Remark</th>
                                                        <th className="px-4 py-2 uppercase tracking-tighter">Rework Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {cat.checkpoints.map((cp, i) => (
                                                        <tr key={i} className="hover:bg-indigo-50/30 transition">
                                                            <td className="px-4 py-3 text-center font-bold text-gray-300">{i + 1}</td>
                                                            <td className="px-4 py-3 font-medium min-w-[200px]">{cp.question}</td>
                                                            <td className="px-4 py-3 whitespace-nowrap">
                                                                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{cp.block}-{cp.floor}</span>
                                                                <span className="ml-1 opacity-70">{cp.location}</span>
                                                            </td>
                                                            <td className="px-4 py-3 font-bold">{cp.seName}</td>
                                                            <td className="px-4 py-3">{cp.qeName || 'N/A'}</td>
                                                            <td className="px-4 py-3 whitespace-nowrap border-r border-gray-50">
                                                                <div className="font-bold">{cp.openingDate}</div>
                                                                <div className="text-[9px] opacity-60 font-medium">{cp.openingTime}</div>
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap border-r border-gray-50">
                                                                <div className={`font-bold ${cp.closingDate === '-' ? 'text-gray-300' : 'text-green-600'}`}>{cp.closingDate}</div>
                                                                {cp.closingTime !== '-' && <div className="text-[9px] opacity-60 font-medium">{cp.closingTime}</div>}
                                                            </td>
                                                            <td className="px-4 py-3 italic text-red-500 font-medium border-r border-gray-50">{cp.qeRemark || cp.observation}</td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className={`text-[10px] font-black px-3 py-1 rounded shadow-sm border ${cp.status === 'Approved'
                                                                    ? 'bg-green-50 text-green-600 border-green-200'
                                                                    : 'bg-red-50 text-red-600 border-red-200'
                                                                    }`}>
                                                                    {cp.status === 'Approved' ? 'CLOSED' : 'OPEN'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {loading && (
                <div className="fixed inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-[9999]">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 border-4 border-[#004080] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-xs font-bold text-[#004080] animate-pulse">Syncing Rework Data...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HODDashboard;

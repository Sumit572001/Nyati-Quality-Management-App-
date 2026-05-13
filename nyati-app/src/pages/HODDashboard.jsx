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
import BASE_URL from '../config';

const HODDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [summary, setSummary] = useState({ totalReworks: 0, totalReworkItems: 0, projectWise: [] });
    const [selectedProject, setSelectedProject] = useState('All Projects');
    const [projectDetails, setProjectDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedCategory, setExpandedCategory] = useState(null);

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
            const res = await axios.get(`${BASE_URL}/api/hod/rework-summary`);
            setSummary(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Summary fetch error", err);
        }
    }, []);

    const fetchProjectDetails = useCallback(async (projectName) => {
        if (projectName === 'All Projects') {
            setProjectDetails(null);
            return;
        }
        setLoading(true);
        try {
            const res = await axios.get(`${BASE_URL}/api/hod/project-reworks?project=${encodeURIComponent(projectName)}`);
            setProjectDetails(res.data);
        } catch (err) {
            console.error("Project detail fetch error", err);
        } finally {
            setLoading(false);
        }
    }, []);

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
        fetchProjectDetails(name);
        setExpandedCategory(null);
    };

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
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="Logo" className="h-10" />
                        <h1 className="text-lg font-bold tracking-tight">HOD Dashboard</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-xs opacity-75 font-medium">Logged in as</span>
                            <span className="text-sm font-bold">{user.fullName}</span>
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

            <main className="max-w-5xl mx-auto px-4 mt-6 space-y-6">

                {/* STATS ROW */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    {/* TOTAL REWORKS */}
                    <div className="bg-red-100/50 p-5 rounded-2xl border border-red-200 flex items-center justify-between 
    transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.02] cursor-pointer">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Reworks</p>
                            <h2 className="text-3xl font-black text-red-600 mt-1">{summary.totalReworks}</h2>
                        </div>
                        <div className="w-12 h-12 bg-red-200/50 rounded-xl flex items-center justify-center text-red-600 text-xl">
                            <FontAwesomeIcon icon={faExclamationTriangle} />
                        </div>
                    </div>

                    {/* PROJECTS AFFECTED */}
                    <div className="bg-blue-100/50 p-5 rounded-2xl border border-blue-200 flex items-center justify-between 
    transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.02] cursor-pointer">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Projects Affected</p>
                            <h2 className="text-3xl font-black text-blue-700 mt-1">{projectsAffected}</h2>
                        </div>
                        <div className="w-12 h-12 bg-blue-200/50 rounded-xl flex items-center justify-center text-blue-700 text-xl">
                            <FontAwesomeIcon icon={faBuilding} />
                        </div>
                    </div>

                    {/* MOST CRITICAL */}
                    <div className="bg-orange-100/50 p-5 rounded-2xl border border-orange-200 flex items-center justify-between 
    transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.02] cursor-pointer">
                        <div className="truncate pr-2">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Most Critical</p>
                            <h2 className="text-xl font-black text-orange-600 mt-2 truncate max-w-[180px]">
                                {mostCritical}
                            </h2>
                        </div>
                        <div className="w-12 h-12 bg-orange-200/50 rounded-xl flex items-center justify-center text-orange-600 text-xl">
                            <FontAwesomeIcon icon={faTrophy} />
                        </div>
                    </div>

                </div>

                {/* FILTER DROPDOWN */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                            <FontAwesomeIcon icon={faFilter} />
                        </div>
                        <h3 className="font-bold text-sm">Filter by Project</h3>
                    </div>
                    <div className="relative group">
                        <select
                            className="appearance-none bg-gray-50 border border-gray-200 text-sm font-bold rounded-xl px-4 py-2.5 pr-10 outline-none focus:ring-2 focus:ring-[#004080]/20 focus:border-[#004080] transition w-full sm:w-64 cursor-pointer"
                            value={selectedProject}
                            onChange={(e) => handleProjectChange(e.target.value)}
                        >
                            <option value="All Projects">All Projects</option>
                            {summary.projectWise.map(p => (
                                <option key={p.projectName} value={p.projectName}>{p.projectName}</option>
                            ))}
                        </select>
                        <FontAwesomeIcon icon={faChevronDown} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus:rotate-180 transition" />
                    </div>
                </div>

                {/* MAIN TABLE SECTION */}
                {!projectDetails ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                            <h3 className="font-black text-gray-400 text-xs uppercase tracking-widest flex items-center gap-2">
                                <FontAwesomeIcon icon={faChartBar} /> Projects
                            </h3>
                            <button onClick={fetchSummary} className="text-primary text-xs font-bold hover:underline flex items-center gap-1">
                                <FontAwesomeIcon icon={faSync} className={loading ? 'animate-spin' : ''} /> Refresh
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase border-b border-gray-100">
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
                                                        <span className="font-bold text-sm text-[#004080] group-hover:underline">{p.projectName}</span>
                                                        <span className="text-[10px] text-gray-400">{p.siteName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-black">{p.reworkCount}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter ${isCritical ? 'bg-red-100 text-red-600' :
                                                        isHigh ? 'bg-orange-100 text-orange-600' :
                                                            'bg-yellow-100 text-yellow-600'
                                                        }`}>
                                                        {isCritical ? 'CRITICAL' : isHigh ? 'HIGH' : 'MODERATE'}
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
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
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
                                            <span className="w-8 h-8 bg-indigo-50 text-indigo-500 rounded-lg flex items-center justify-center font-bold text-xs">{idx + 1}</span>
                                            <span className="font-bold text-sm">{cat.category}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="bg-gray-100 text-gray-500 text-[10px] font-black px-2.5 py-1 rounded-full">{cat.reworkCount} REWORKS</span>
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
                                            <table className="w-full text-[11px]">
                                                <thead className="bg-gray-50 shadow-inner">
                                                    <tr className="text-gray-400 font-bold uppercase tracking-tighter">
                                                        <th className="px-4 py-2 border-r border-gray-100 italic">#</th>
                                                        <th className="px-4 py-2 border-r border-gray-100">Checkpoint Question</th>
                                                        <th className="px-4 py-2 border-r border-gray-100">Location</th>
                                                        <th className="px-4 py-2 border-r border-gray-100">Engineer</th>
                                                        <th className="px-4 py-2 border-r border-gray-100">QE Name</th>
                                                        <th className="px-4 py-2 border-r border-gray-100">Date</th>
                                                        <th className="px-4 py-2">QE Remark</th>
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
                                                            <td className="px-4 py-3 whitespace-nowrap">{cp.date}</td>
                                                            <td className="px-4 py-3 italic text-red-500 font-medium">{cp.qeRemark || cp.observation}</td>
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

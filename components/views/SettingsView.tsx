import React from 'react';
import { motion } from 'framer-motion';
import { Settings, Sun, Moon, Globe, Lock, User, LogOut } from 'lucide-react';
import { getCurrencyOptions } from '../../utils/currencyUtils';
import { Language } from '../../constants';

interface SettingsViewProps {
    itemVariants: any;
    selectedCurrency: string;
    setSelectedCurrency: (curr: string) => void;
    t: (key: string) => string;
    theme: string;
    updateProfile: (updates: any) => void;
    language: Language;
    setIsPasswordModalOpen: (open: boolean) => void;
    user: any;
    signOut: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({
    itemVariants,
    selectedCurrency,
    setSelectedCurrency,
    t,
    theme,
    updateProfile,
    language,
    setIsPasswordModalOpen,
    user,
    signOut
}) => {
    return (
        <motion.div variants={itemVariants} className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Settings size={20} className="text-slate-400" />
                        Preferences
                    </h3>
                </div>
                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-slate-900 dark:text-slate-100">Currency</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Select your preferred currency view</p>
                        </div>
                        <select
                            value={selectedCurrency}
                            onChange={(e) => setSelectedCurrency(e.target.value)}
                            className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg p-2 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                        >
                            {getCurrencyOptions().map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-slate-900 dark:text-slate-100">{t('setting_theme')}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{t('setting_theme_desc')}</p>
                        </div>
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                            <button
                                onClick={() => updateProfile({ theme: 'light' })}
                                className={`p-2 rounded-md flex items-center gap-2 text-sm transition-all ${theme === 'light' ? 'bg-white shadow text-blue-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                    }`}
                            >
                                <Sun size={16} />
                                {t('theme_light')}
                            </button>
                            <button
                                onClick={() => updateProfile({ theme: 'dark' })}
                                className={`p-2 rounded-md flex items-center gap-2 text-sm transition-all ${theme === 'dark' ? 'bg-slate-700 shadow text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                    }`}
                            >
                                <Moon size={16} />
                                {t('theme_dark')}
                            </button>
                        </div>
                    </div>

                    <div className="h-px bg-slate-100 dark:bg-slate-800"></div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-slate-900 dark:text-slate-100">{t('setting_language')}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{t('setting_language_desc')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Globe size={18} className="text-slate-400" />
                            <select
                                value={language}
                                onChange={(e) => updateProfile({ language: e.target.value as Language })}
                                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            >
                                <option value="en">English</option>
                                <option value="zh">中文 (Chinese)</option>
                                <option value="ms">Bahasa Melayu</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Lock size={20} className="text-slate-400" />
                        Security
                    </h3>
                </div>
                <div className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-slate-900 dark:text-slate-100">Password</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Change your account password</p>
                        </div>
                        <button
                            onClick={() => setIsPasswordModalOpen(true)}
                            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
                        >
                            Change Password
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <User size={20} className="text-slate-400" />
                        Account
                    </h3>
                </div>
                <div className="p-6 flex items-center justify-between">
                    <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">Currently logged in as</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                    </div>
                    <button
                        onClick={signOut}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm font-medium"
                    >
                        <LogOut size={16} />
                        Sign Out
                    </button>
                </div>
            </div>

            <p className="text-sm text-slate-400 dark:text-slate-500 font-mono mt-4 text-center">
                Version: Beta 2.5.4
            </p>
        </motion.div>
    );
};

export default React.memo(SettingsView);

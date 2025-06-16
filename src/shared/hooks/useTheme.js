import { useState, useEffect } from 'react';

export const useTheme = () => {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        // Check if there's a theme preference in localStorage
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            return savedTheme === 'dark';
        }

        // Otherwise, use system preference
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        // Apply theme class to HTML element
        const html = document.documentElement;

        if (isDarkMode) {
            html.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            html.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
    };

    return { isDarkMode, toggleTheme };
};

import { lazy } from 'react';

// Every page loads on demand, so a visitor only downloads the page they open.
export const Home = lazy(() => import('./Home'));
export const Services = lazy(() => import('./Services'));
export const Gallery = lazy(() => import('./Gallery'));
export const Contact = lazy(() => import('./Contact'));
export const Reviews = lazy(() => import('./Reviews'));
export const Bio = lazy(() => import('./Bio'));
export const Admin = lazy(() => import('./Admin'));
export const NotFound = lazy(() => import('./NotFound'));
export const Privacy = lazy(() => import('./Legal').then((m) => ({ default: m.Privacy })));
export const Terms = lazy(() => import('./Legal').then((m) => ({ default: m.Terms })));

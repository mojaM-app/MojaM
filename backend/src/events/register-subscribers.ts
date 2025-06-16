// Import all event subscribers to register them with the event dispatcher
// This file should be imported in the application startup to ensure all subscribers are registered

// Event subscribers from the events module
import './event-subscribers/announcements-events-subscriber';
import './event-subscribers/auth-events-subscriber';
import './event-subscribers/calendar-events-subscriber';
import './event-subscribers/permissions-events-subscriber';
import './event-subscribers/user-events-subscriber';

// Event subscribers from modules
import '../modules/notifications/event-subscribers/user-created-events-subscriber';
import '../modules/notifications/event-subscribers/user-locked-out-events-subscriber';

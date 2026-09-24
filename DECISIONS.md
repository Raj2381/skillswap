# SkillSwap - Decision Points

## Decision Point 1 - Rejection

### Choice
When a creator declines a booking, the booking status changes to `Declined`. The client can still see the declined booking in My Bookings and can return to the marketplace to book another creator or gig.

### Why
Keeping declined bookings visible gives the client a clear request history. The client is not blocked and can continue discovering other available gigs.

## Decision Point 2 - Double Booking

### Choice
A gig cannot accept a second conflicting booking while it already has an accepted booking. Pending requests may remain pending until explicitly accepted or declined.

### Why
The public demo checks for an existing accepted booking for the same gig before accepting another request. This makes the capacity rule deterministic and prevents conflicting commitments.

## Decision Point 3 - Discovery

### Choice
Marketplace results are searchable and filterable by category. When no filter is active, gigs are shown newest first; search and category filters narrow the same deterministic dataset.

### Why
Clients can quickly find relevant services while newly published gigs remain discoverable. The behavior is simple to demonstrate and does not invent ratings or reviews.

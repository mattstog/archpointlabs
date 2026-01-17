# Product Requirements Document: Clickable Count Cards Enhancement

**Project:** archpointlabs  
**Feature:** Interactive Count Cards for Conversation Dashboard  
**PM:** Alex  
**Date:** January 17, 2026  

---

## Executive Summary

We're enhancing the conversation dashboard admin page by making the "Today" and "This Week" count cards clickable filters. This improvement will streamline the admin workflow by providing quick access to time-filtered conversation views without requiring dropdown interaction.

**Business Value:** Improved admin efficiency and better UX consistency with existing filter patterns.

---

## User Stories

### Story 1: Clickable Today Card
**As a** conversation dashboard admin  
**I want** to click the "Today" count card  
**So that** I can quickly filter the conversation list to show only today's conversations

**Acceptance Criteria:**
- [ ] "Today" card displays hover effects indicating it's clickable
- [ ] Clicking the card applies "today" filter to conversation list below
- [ ] Active filter state is visually indicated on the card
- [ ] Filter behavior matches existing time dropdown "Today" option
- [ ] Card maintains its current count display functionality

### Story 2: Clickable This Week Card
**As a** conversation dashboard admin  
**I want** to click the "This Week" count card  
**So that** I can quickly filter the conversation list to show only this week's conversations

**Acceptance Criteria:**
- [ ] "This Week" card displays hover effects indicating it's clickable
- [ ] Clicking the card applies "this week" filter to conversation list below
- [ ] Active filter state is visually indicated on the card
- [ ] Filter behavior matches existing time dropdown "This Week" option
- [ ] Card maintains its current count display functionality

### Story 3: Filter State Management
**As a** conversation dashboard admin  
**I want** consistent filter behavior between cards and dropdown  
**So that** I have a predictable and intuitive filtering experience

**Acceptance Criteria:**
- [ ] Only one time filter can be active at a time
- [ ] Clicking a card deactivates other time filters
- [ ] Dropdown selection deactivates active card filters
- [ ] Clear visual indication of which filter is currently active
- [ ] Filter state persists during session (if existing behavior supports this)

---

## Success Metrics

### Primary KPIs
- **User Engagement:** 25% increase in time filter usage within first month
- **Admin Efficiency:** Reduction in average time to apply common filters

### Secondary Metrics
- **Feature Adoption:** % of admin users who use clickable cards vs dropdown
- **User Satisfaction:** Qualitative feedback on improved workflow
- **Technical Performance:** No degradation in page load or filter response time

---

## Non-Functional Requirements

### Performance
- Card click response time: < 200ms
- Filter application time: Match existing dropdown performance
- No additional API calls beyond current filtering implementation

### Accessibility
- Cards must be keyboard navigable (Tab/Enter)
- Screen reader support with appropriate ARIA labels
- Focus indicators meet WCAG 2.1 AA standards
- Maintain color contrast ratios for all states

### Browser Compatibility
- Support all browsers currently supported by the application
- Graceful degradation for older browsers

### Responsive Design
- Cards remain clickable and visually coherent across all screen sizes
- Touch-friendly targets on mobile devices (min 44px)

---

## Technical Considerations

### Integration Points
- Existing time filter dropdown logic
- Conversation list filtering mechanism
- State management system (likely React state or similar)
- Current card component architecture

### UI/UX Requirements
- **Hover State:** Subtle elevation, cursor pointer, color/border changes
- **Active State:** Distinct visual indicator (border, background, icon)
- **Transition:** Smooth hover/click animations using existing design system
- **Consistency:** Match existing interactive elements' styling patterns

---

## Out of Scope

- Additional time period cards (e.g., "This Month", "Last 30 Days")
- Modification of existing dropdown functionality beyond state synchronization
- Changes to conversation data fetching logic
- Mobile-specific gesture interactions beyond standard touch
- Advanced filtering combinations (multiple time periods, AND/OR logic)

---

## Assumptions & Open Questions

### Assumptions
- Existing filter logic is reusable for card interactions
- Current state management can handle the new interaction patterns
- Design system has sufficient interactive states for cards
- No backend changes required (filtering is frontend-only)

### Open Questions
1. **Design System:** Are there existing interactive card patterns we should follow?
2. **Analytics:** Should we track card clicks separately from dropdown usage?
3. **Default State:** Should any card be active by default, or start with "All Time"?
4. **Keyboard Navigation:** What's the expected tab order with the new clickable cards?

### Validation Needed
- [ ] Review existing conversation dashboard code structure
- [ ] Confirm current filter state management approach
- [ ] Validate design system components available
- [ ] Test current dropdown filter logic for reusability

---

**Next Steps:**
1. Technical discovery of existing filter implementation
2. Design review of interactive states and patterns
3. Development estimation and sprint planning

---
*Alex - Senior Product Manager, Claude Dev Team*
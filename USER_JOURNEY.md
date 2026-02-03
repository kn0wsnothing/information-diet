# Information Diet - User Journey & Product Vision

## Ideal User Profile
**English-speaking knowledge workers** (analysts, writers, PMs) who:
- Have 100+ saved items in Readwise/Instapaper/Bookmarks
- Subscribe to multiple newsletters but skim most
- Own "aspirational" books only partially read
- Talk about "signal vs noise," "info diet," "overwhelm"

## Core Problem
Users struggle to balance their information consumption:
- **Default behavior**: Whatever feels like or whatever pops up
- **The gap**: Missing timely information while defaulting to books
- **The need**: Structure and awareness without judgment

## Product Goals
1. **Awareness** - Help users see patterns in what they consume
2. **Structure** - Provide framework (snacks/meals/time-tested) without being pushy
3. **Balance** - Suggest reading to achieve balanced diet over time (7-14-21 day average)
4. **Empowerment** - Gentle suggestions, not judgment

---

## Daily User Journey

### Morning Check-In (2-3 min)
1. User opens app
2. Sees personalized suggestion based on their recent diet
   - If heavy on snacks: "You've been reading quick pieces. Ready for something deeper?"
   - If heavy on books: "You might enjoy a timely newsletter piece today"
   - If balanced: "Keep it up! Here's what's next"
3. User either:
   - **Takes suggestion** → Opens article/book → Reads → Marks done
   - **Browses queue** → Picks something else
   - **Adds new item** → Pastes link or searches

### Throughout Day
- User reads items from queue (snacks take 2 min, meals take 15-30 min, books ongoing)
- Marks items as "done" when finished (or when they've read all they will)
- Can pause/resume books across multiple days

### Evening (Optional)
- Sees weekly summary if available
- Reflects on diet balance

---

## Key Behaviors to Track

### Completion Definition & Time Tracking
**Key insight**: Balance is measured by *attention spent*, not *items read*. A book counts more than a tweet.

- **Snacks** (2-min reads): ~2-5 minutes per item
  - Mark done when finished (fully consumed in one sitting)
  - Time tracked: 2-5 min per item
  
- **Meals** (essays/newsletters): ~15-45 minutes per item
  - May read over multiple sessions
  - User can log progress: "spent 20 min today, will finish tomorrow"
  - Time tracked: 15-45 min per item (or user-specified)
  
- **Time-tested** (books): Hours/days per item
  - Mark done when finished reading
  - User can log progress: "read 50 pages today" or "spent 2 hours"
  - Time tracked: User-logged hours or estimated from pages read

### Diet Tracking (Attention-Based)
- **Metric**: Total attention time spent per category (not item count)
- **Balance calculation**: % of total reading time spent on snacks vs meals vs time-tested
  - Example: 30 min snacks + 60 min meals + 120 min books = 210 min total
  - Diet: 14% snacks, 29% meals, 57% time-tested
- **Rolling averages**: 7/14/21 day windows
- **Rebalancing suggestions**: "You've spent 70% of your time on snacks this week. Maybe dedicate some time to a meal or book?"

---

## Tone & Interaction Model

### Gentle Friend (Not Pushy Coach)
- **Descriptive**: "You've been snacking a lot lately"
- **Suggestive**: "Maybe try a meal next?"
- **Prescriptive**: "Here's what I think you should read next"
- **Never judgmental**: "No judgment, just patterns"

### Notification Strategy
- **No aggressive push notifications** (for now)
- Web-first, daily check-in is primary interaction
- iOS app later (not priority)

---

## Ideal Daily Reading Pattern (User's Personal Goal)
- **Snacks** (2-min skims): Few per day
- **Meals** (essays/newsletters): Make progress on one
- **Time-tested** (books): Make progress on one
- **Not all three every day** - but balanced over 7-14 days

---

## Core Features Needed (Priority Order)

### MVP (Already Built)
- ✅ Readwise sync (snacks/meals/time-tested classification)
- ✅ Queue display
- ✅ Mark items as done (structure exists, UI needed)

### Phase 1 (Next - Web Development Focus)
- [ ] Manual link addition (paste URL to queue)
- [ ] RSS feed support (newsletters)
- [ ] Mark item as done UI (button on queue items)
- [ ] View completed items (history)
- [ ] Weekly diet summary (% snacks/meals/time-tested)

### Phase 2
- [ ] Curated "time-tested" library (seeded books)
- [ ] Smart suggestions (based on diet imbalance)
- [ ] Reading time estimates
- [ ] Search/filter queue

### Phase 3+
- [ ] Email digest of suggestions
- [ ] Sharing/social features
- [ ] iOS app
- [ ] Analytics dashboard

5. Live Show Flow (From Audience Perspective + Operator Actions)
5.1 Doors Open – 12:30
Audience sees:
A Lobby Animation Screen:
Floating logos of partners and supporters.
Animated compilation of:
Team names.
Funny messages / quotes from the platform.
Think “waiting room / lobby”.
Operator flow:
Opens Live Control Panel.
Selects EventStage = Doors Open.
Audience Screen switches to:
Background animation (looped).
No timer needed, just continuous loop.
5.2 Pre-show Team Card Wall – ~13:00 (30 mins before Welcome)
Audience sees:
A FIFA Ultimate Team–style grid:
All team cards visible together.
Each card showing:
Team name
University
Global rank badge
Key stats (performance, Sharpe, Sortino)
Strategy tagline.


Slow zoom/pan animation or hover cycling across cards (auto).
Operator flow:
In the Control Panel, selects EventStage = Pre-show Team Card Wall.
Audience Screen transitions to card wall layout.
Optional: operator can click on individual cards to enlarge them:
If clicked, the Audience Screen temporarily zooms in that specific card and briefly shows its details, then zooms back out to the grid (or operator closes it).
5.3 On-Stage Welcome – 13:30
5.3.1 Hosts Intro
Audience sees:
Host Screen:
Large photos of you and Luba.
Names + titles (e.g. “Giorgio – Co-founder, MCD Edu”; “Luba – Co-founder, Umushroom”)
Partner logos around/underneath.
No heavy animation, just a clean hero screen.
Operator flow:
Select EventStage = On-Stage Welcome.
Audience Screen switches to host intro layout.
Operator can:
Toggle between:
“Hosts only” view.
“Hosts + Partner Logos”.


Or just leave one layout.
5.3.2 Jury Reveal (still Welcome block)
Audience sees:
FIFA-style “pack opening” / unboxing for each jury card:
One jury card appears at a time, with animation:
Card silhouette -> reveal name, photo, role, company.
Sequence continues until all jury members are introduced.
Operator flow:
Clicks a “Start Jury Reveal” button.
System:
For each jury member, sequentially:
Plays animation on Audience Screen.
Operator can:
Click “Next Jury” to manually advance.
Or let it auto-play with fixed delays (configurable).
After last jury card, Audience Screen returns to a summary view (all jury cards small in a row) or transitions to “Ready for Round 1” screen.


5.4 Pitching Round 1 – 14:00
Round definition:
Teams: 5 teams assigned to Round 1.
Logic:
At the start, order is randomized and displayed to audience as a “line-up”.
Then, within this line-up, each team is randomly selected as they go (either visible up front or hidden until revealed).
5.4.1 Round Start – Line-up Reveal
Audience sees:
Screen title: “Pitching Round 1”.
FIFA-style line-up / squad view:
5 team cards displayed in a row or formation.
Maybe “randomizing” animation (cards shuffle, then settle).
A small progress bar or row at top with the 5 cards: initially all grey/“not presented”.
Operator flow:
Select EventStage = Pitching Round 1.
Click “Randomize teams”.
System:
Shuffles the 5 teams assigned to Round 1.
Saves this order.


Audience Screen:
Shows animation of shuffling.
Ends with the finalized line-up.
5.4.2 Individual Team Presentation
For each of the 5 teams:
Audience sees:
Team card gets zoomed in to centre of screen:
Full-screen card.
After a brief pause, it “opens” to show:
Team name, university.
Team member photos + names.
Quotes from each member (optional).
Strategy tear sheet visual (or link summary).
Key stats panel (performance, Sharpe, Sortino).
At the top:
A progress bar made of 5 mini-cards.
Current team highlighted.
Teams already presented marked as “completed”.


Timer visible:


First: 6:00 countdown for presentation.
Then: 4:00 countdown for Q&A (only counting when candidates speak – practically, operator controls this).
Operator flow per team:
On Control Panel, sees list of 5 teams in Round 1 (in fixed order from randomization).
Clicks “Next Team” (or selects specific team).
System:
Updates Audience Screen:
Zooms into that team’s card.
Opens detailed view.
Updates top progress bar.


Operator then:
Clicks “Start Presentation Timer”.
6-min timer appears on Audience Screen and starts counting down.
Optional: subtle sound at 1 minute left.
On timer end:
System triggers buzzer sound and maybe a visual cue (e.g. flashing border).
Operator clicks “Start Q&A Timer (4min)” when Q&A begins.
Another countdown appears.
Ends with another buzzer.
Jury scoring flow:
While the team is presenting OR just after:
Each jury member’s scoring UI highlights the current team.
Jury sees:
Team name, university, tagline, key stats.
Scoring fields (sliders or dropdowns).
“Submit” button.


When a jury member clicks “Submit”:


Score is saved for that team and that round.
UI shows a “✓ Scored” state.


Optionally: Operator can see at a glance which jury members have submitted for each team.


5.4.3 End of Round 1
Audience sees:
Round summary screen:
Progress bar shows all 5 teams completed.
Optionally, just a decorative “Round 1 complete” screen.
Operator flow:
Clicks “End Round” → transitions to next EventStage (Comfort Break).
5.5 Comfort Break – 14:45 (15 mins)
Audience sees:
Break Screen:
Text: “Comfort Break – we’ll resume at 15:00”.
Soft background animation (subtle, calmer than pitch rounds).
15-minute countdown timer displayed prominently.
Operator flow:
Select EventStage = Comfort Break.
Click “Start Break Timer (15:00)”.
Audience Screen:
Shows break screen + countdown.
Timer ends:
Visual cue + chime (optional).
Operator then switches to Pitching Round 2 when the room is ready.
5.6 Pitching Round 2 – 15:00
Audience experience & operator actions:
Identical to Pitching Round 1 but with the next 5 teams.
Sequence:
Round start → randomize → show line-up → team-by-team:
Zoom card → detailed view → 6min presentation timer → 4min Q&A timer.
Jury continues scoring via same UI.
5.7 Refreshments Break – 15:45 (15 mins)
Audience sees:
“Refreshments Break – grab a drink and snacks” + logos.
15 min countdown.
Operator flow:
Same as Comfort Break:
Select EventStage = Refreshments Break.
Start 15-minute timer.
5.8 Keynote Speaker 1 – 16:00
Audience sees:
Speaker Profile Screen (more professional, less “card game”):
Speaker photo large.
Name, title, company.
Short bio/description.
No dramatic animation like the players, just a clean fade-in.
Operator flow:
Select EventStage = Keynote 1.
Audience Screen switches to Keynote 1 profile layout.
Operator can toggle:
“Profile view” vs. “Minimal view” (just name + company on a clean background) while the speaker is on stage.
5.9 Pitching Round 3 – 16:10
Audience + operator:
Same flow as Rounds 1 & 2 with the final 5 teams.
Again: randomize line-up → individual team cards → timers → jury scoring → round summary.
5.10 Keynote Speaker 2 – 17:00
Audience sees:
Same style of Speaker Profile Screen as Keynote 1.
Operator:
Select EventStage = Keynote 2.
Same controls as Keynote 1.
5.11 Awards Ceremony – 17:10
This is where scores need to be fully in the system.
Backend logic:
Once all teams have been scored:
System computes:
Total score per team (e.g. average across jurors, or sum).
Ranks teams.
Identifies:
1st place
2nd place
3rd place


Admin can review and “lock in” results in a small admin view before the awards stage goes live.
Audience sees:
Awards Intro Screen:
Title: “Awards Ceremony”.
Simple background, maybe all teams faint in the background.


Podium Reveal:
A virtual podium: 1st (centre, tallest), 2nd, 3rd.
For each place:
FIFA-style animation as the team card appears on the podium:
E.g. first show the podium with slots, then unveil 3rd, then 2nd, then 1st
When a winner is announced:
Their card zooms in with team name, university, main stats, tagline.
Operator flow:
Select EventStage = Awards Ceremony.
Audience sees Awards intro.
Operator clicks:


“Reveal 3rd place” → card animation for 3rd.
“Reveal 2nd place” → card animation for 2nd.
“Reveal 1st place” → big animation for 1st.


Each reveal coincides with calling teams on stage.


5.12 Networking & Apero – 17:30
Audience sees:
Networking Screen:


Message: “Thank you for joining the UK Investment Challenge Final!”
Instructions: “Please head downstairs for networking & apero. Meet the teams, judges, and partners.”
Partner & supporter logos.
Optionally, QR codes: link to feedback form, link to platform, etc.
Operator flow:
Select EventStage = Networking & Apero.
No timer needed (optional).
Screen can stay on until shutdown.

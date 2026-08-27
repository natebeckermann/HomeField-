export type Team = {
  id: string;
  name: string;
  shortName: string;
  short: string;
  city: string;
  sport: string;
  league: string;
  primary: string;
  secondary: string;
};

export type Coverage = "full" | "major" | "off";

export type LeaguePref = {
  id: string;
  name: string;
  coverage: Coverage;
};

export type NewsSource = {
  id: string;
  name: string;
  rank: number;
  enabled: boolean;
  note?: string;
};

export const teamCatalog: Team[] = [
  { id: "stl-cardinals", name: "St. Louis Cardinals", shortName: "STL", short: "STL", city: "St. Louis", sport: "Baseball", league: "MLB", primary: "#C41E3A", secondary: "#0C2340" },
  { id: "chc-cubs", name: "Chicago Cubs", shortName: "CHC", short: "CHC", city: "Chicago", sport: "Baseball", league: "MLB", primary: "#0E3386", secondary: "#CC3433" },
  { id: "nyy-yankees", name: "New York Yankees", shortName: "NYY", short: "NYY", city: "New York", sport: "Baseball", league: "MLB", primary: "#0C2340", secondary: "#C4CED4" },
  { id: "lad-dodgers", name: "Los Angeles Dodgers", shortName: "LAD", short: "LAD", city: "Los Angeles", sport: "Baseball", league: "MLB", primary: "#005A9C", secondary: "#FFFFFF" },
  { id: "stl-blues", name: "St. Louis Blues", shortName: "STL", short: "STL", city: "St. Louis", sport: "Hockey", league: "NHL", primary: "#002F87", secondary: "#FCB514" },
  { id: "chi-blackhawks", name: "Chicago Blackhawks", shortName: "CHI", short: "CHI", city: "Chicago", sport: "Hockey", league: "NHL", primary: "#CF0A2C", secondary: "#000000" },
  { id: "nyr-rangers", name: "New York Rangers", shortName: "NYR", short: "NYR", city: "New York", sport: "Hockey", league: "NHL", primary: "#0038A8", secondary: "#CE1126" },
  { id: "indiana-football", name: "Indiana Hoosiers Football", shortName: "IU", short: "IU", city: "Bloomington", sport: "Football", league: "College Football", primary: "#990000", secondary: "#EEEDEB" },
  { id: "notre-dame-football", name: "Notre Dame Fighting Irish Football", shortName: "ND", short: "ND", city: "Notre Dame", sport: "Football", league: "College Football", primary: "#0C2340", secondary: "#C99700" },
  { id: "ohio-state-football", name: "Ohio State Buckeyes Football", shortName: "OSU", short: "OSU", city: "Columbus", sport: "Football", league: "College Football", primary: "#BB0000", secondary: "#666666" },
  { id: "indiana-basketball", name: "Indiana Hoosiers Basketball", shortName: "IU", short: "IU", city: "Bloomington", sport: "Basketball", league: "College Basketball", primary: "#990000", secondary: "#EEEDEB" },
  { id: "slu-basketball", name: "Saint Louis Billikens", shortName: "SLU", short: "SLU", city: "St. Louis", sport: "Basketball", league: "College Basketball", primary: "#003DA5", secondary: "#FFFFFF" },
  { id: "duke-basketball", name: "Duke Blue Devils", shortName: "DUKE", short: "DUKE", city: "Durham", sport: "Basketball", league: "College Basketball", primary: "#003087", secondary: "#FFFFFF" },
  { id: "stl-city", name: "St. Louis CITY SC", shortName: "CITY", short: "CITY", city: "St. Louis", sport: "Soccer", league: "MLS", primary: "#D50032", secondary: "#001E62" },
  { id: "inter-miami", name: "Inter Miami CF", shortName: "MIA", short: "MIA", city: "Miami", sport: "Soccer", league: "MLS", primary: "#F7B5CD", secondary: "#231F20" },
  { id: "man-utd", name: "Manchester United", shortName: "MU", short: "MU", city: "Manchester", sport: "Soccer", league: "Premier League", primary: "#DA291C", secondary: "#FBE122" },
  { id: "arsenal", name: "Arsenal", shortName: "ARS", short: "ARS", city: "London", sport: "Soccer", league: "Premier League", primary: "#EF0107", secondary: "#063672" },
  { id: "liverpool", name: "Liverpool", shortName: "LIV", short: "LIV", city: "Liverpool", sport: "Soccer", league: "Premier League", primary: "#C8102E", secondary: "#00B2A9" },
  { id: "chiefs", name: "Kansas City Chiefs", shortName: "KC", short: "KC", city: "Kansas City", sport: "Football", league: "NFL", primary: "#E31837", secondary: "#FFB81C" },
  { id: "bears", name: "Chicago Bears", shortName: "CHI", short: "CHI", city: "Chicago", sport: "Football", league: "NFL", primary: "#0B162A", secondary: "#C83803" },
  { id: "celtics", name: "Boston Celtics", shortName: "BOS", short: "BOS", city: "Boston", sport: "Basketball", league: "NBA", primary: "#007A33", secondary: "#BA9653" },
  { id: "lakers", name: "Los Angeles Lakers", shortName: "LAL", short: "LAL", city: "Los Angeles", sport: "Basketball", league: "NBA", primary: "#552583", secondary: "#FDB927" }
];

export const defaultFavoriteTeamIds = [
  "stl-cardinals",
  "stl-blues",
  "indiana-football",
  "indiana-basketball",
  "slu-basketball",
  "stl-city",
  "man-utd"
];

export const defaultLeaguePrefs: LeaguePref[] = [
  { id:"mlb",name:"MLB",coverage:"full"},{id:"nhl",name:"NHL",coverage:"full"},{id:"cfb",name:"College Football",coverage:"full"},{id:"cbb",name:"College Basketball",coverage:"full"},{id:"mls",name:"MLS",coverage:"full"},{id:"epl",name:"Premier League",coverage:"full"},{id:"nfl",name:"NFL",coverage:"full"},{id:"nba",name:"NBA",coverage:"major"},{id:"wnba",name:"WNBA",coverage:"off"},{id:"ucl",name:"UEFA Champions League",coverage:"full"},{id:"fa-cup",name:"FA Cup",coverage:"off"},{id:"uel",name:"Europa League",coverage:"major"},{id:"nwsl",name:"NWSL",coverage:"off"},{id:"laliga",name:"La Liga",coverage:"off"},{id:"bundesliga",name:"Bundesliga",coverage:"off"},{id:"seriea",name:"Serie A",coverage:"off"},{id:"ligue1",name:"Ligue 1",coverage:"off"},{id:"march",name:"March Madness",coverage:"full"},{id:"draft",name:"NFL Draft",coverage:"full"},{id:"mlb-post",name:"MLB Postseason",coverage:"full"},{id:"nhl-post",name:"NHL Playoffs",coverage:"full"},{id:"nba-post",name:"NBA Playoffs",coverage:"major"},{id:"cfp",name:"College Football Playoff",coverage:"full"},{id:"usoc",name:"U.S. Open Cup",coverage:"full"},{id:"intl",name:"World Cup / International Soccer",coverage:"full"},{id:"pga",name:"PGA Tour",coverage:"full"},{id:"lpga",name:"LPGA Tour",coverage:"off"},{id:"tennis",name:"ATP / WTA Tennis",coverage:"off"},{id:"f1",name:"Formula 1",coverage:"off"},{id:"nascar",name:"NASCAR",coverage:"off"},{id:"indycar",name:"IndyCar",coverage:"off"},{id:"ufc",name:"UFC / MMA",coverage:"off"},{id:"boxing",name:"Boxing",coverage:"off"},{id:"lacrosse",name:"Lacrosse",coverage:"off"},{id:"volleyball",name:"Volleyball",coverage:"off"},{id:"softball",name:"Softball",coverage:"off"},{id:"olympics",name:"Olympics",coverage:"off"}
];

export const defaultNewsSources: NewsSource[] = [
  { id: "espn", name: "ESPN", rank: 1, enabled: true, note: "Free articles only · ESPN+ excluded" },
  { id: "br", name: "Bleacher Report", rank: 2, enabled: true },
  { id: "official", name: "Official team & league sites", rank: 3, enabled: true },
  { id: "cbs", name: "CBS Sports", rank: 4, enabled: true },
  { id: "yahoo", name: "Yahoo Sports", rank: 5, enabled: true },
  { id: "local", name: "Local beat & TV coverage", rank: 6, enabled: true, note: "Only articles that are free to read" },
  { id: "ap", name: "AP / Reuters", rank: 7, enabled: true },
  { id: "sbn", name: "Team community sites", rank: 8, enabled: true }
];

export const initialFavoriteTeamIds = defaultFavoriteTeamIds;
export const defaultSources = defaultNewsSources;

export const events = [
  { teamId: "stl-cardinals", status: "NEXT", title: "Cardinals vs. Opponent", detail: "Upcoming game • Time TBD" },
  { teamId: "stl-blues", status: "PRESEASON", title: "Blues hockey", detail: "Season hub • Schedule coming soon" },
  { teamId: "indiana-football", status: "NEXT", title: "Indiana Football", detail: "Next matchup • Saturday" },
  { teamId: "man-utd", status: "NEXT", title: "Manchester United", detail: "Premier League • Next fixture" }
];

export const stories = [
  { id: 1, teamId: "stl-cardinals", source: "ESPN", priority: 1, free: true, headline: "Cardinals team news will appear here", summary: "HomeField will combine free-to-read reporting, team updates and relevant league context into one card.", tag: "TEAM NEWS" },
  { id: 2, teamId: "man-utd", source: "Bleacher Report", priority: 2, free: true, headline: "Manchester United coverage, prioritized for you", summary: "Bleacher Report is weighted directly behind ESPN in your personal source ranking.", tag: "TOP STORY" },
  { id: 3, teamId: "indiana-football", source: "ESPN", priority: 1, free: true, headline: "Indiana football headlines land in your team feed", summary: "College football stories, rankings and schedule information will sit beside the team-specific feed.", tag: "COLLEGE FOOTBALL" },
  { id: 4, teamId: "stl-city", source: "Official Team", priority: 3, free: true, headline: "CITY SC official updates and local coverage", summary: "Official announcements can be mixed with free local and national reporting without repeating the same story.", tag: "MLS" }
];

export const demoGames = events.map((event, index) => ({
  id: `game-${index + 1}`,
  teamId: event.teamId,
  status: event.status === "LIVE" ? "live" : event.status === "FINAL" ? "final" : "upcoming",
  opponent: event.title.includes(" vs. ") ? `vs. ${event.title.split(" vs. ")[1]}` : event.title,
  detail: event.detail,
}));

export const demoStories = stories.map((story) => ({
  ...story,
  time: "Now",
}));

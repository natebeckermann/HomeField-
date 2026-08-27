import GameCenterClient from "@/components/GameCenterClient";
export default async function GamePage({params}:{params:Promise<{gameId:string}>}) {
  const {gameId}=await params;
  return <GameCenterClient gameId={gameId}/>;
}

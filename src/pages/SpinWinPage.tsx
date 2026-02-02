import { useState, useRef } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useSpinRewards, useCanSpin, useSpin, useUserSpins } from "@/hooks/useSpinWheel";
import { Button } from "@/components/ui/button";
import { Trophy, Gift, Clock, Star, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const SpinWinPage = () => {
  const { user } = useAuth();
  const { data: rewards = [] } = useSpinRewards();
  const { data: canSpin } = useCanSpin();
  const { data: userSpins = [] } = useUserSpins();
  const spinMutation = useSpin();
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<any>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  const handleSpin = async () => {
    if (!user) {
      toast.error("Please login to spin the wheel!");
      return;
    }

    if (!canSpin) {
      toast.error("You can only spin once every 24 hours!");
      return;
    }

    if (isSpinning || rewards.length === 0) return;

    setIsSpinning(true);
    setResult(null);

    try {
      const spinResult = await spinMutation.mutateAsync(rewards);
      
      // Calculate rotation to land on the winning segment
      const rewardIndex = rewards.findIndex(r => r.id === spinResult.reward_id);
      const segmentAngle = 360 / rewards.length;
      const targetAngle = rewardIndex * segmentAngle + segmentAngle / 2;
      const spins = 5; // Number of full rotations
      const finalRotation = rotation + (360 * spins) + (360 - targetAngle);
      
      setRotation(finalRotation);

      // Show result after animation
      setTimeout(() => {
        setIsSpinning(false);
        setResult(spinResult);
        
        if (spinResult.reward?.reward_type === "nothing") {
          toast.info("Better luck next time! Try again tomorrow.");
        } else {
          toast.success(`🎉 You won ${spinResult.reward?.name}!`);
        }
      }, 4000);
    } catch (error: any) {
      setIsSpinning(false);
      toast.error(error.message || "Something went wrong!");
    }
  };

  const segmentAngle = rewards.length > 0 ? 360 / rewards.length : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero */}
        <section className="bg-gradient-to-br from-secondary via-secondary to-primary/20 py-12 md:py-16">
          <div className="container mx-auto text-center">
            <Trophy className="w-16 h-16 text-primary mx-auto mb-4 animate-bounce-gentle" />
            <h1 className="text-4xl md:text-5xl font-bold font-heading text-secondary-foreground mb-4">
              Spin & <span className="text-primary">Win</span>
            </h1>
            <p className="text-secondary-foreground/80 max-w-xl mx-auto">
              Try your luck every day! Spin the wheel to win cashback, coupons, and exciting rewards.
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto">
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Wheel */}
                <div className="relative flex justify-center">
                  <div className="relative w-72 h-72 md:w-80 md:h-80">
                    {/* Pointer */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
                      <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-primary drop-shadow-lg" />
                    </div>

                    {/* Wheel */}
                    <div
                      ref={wheelRef}
                      className="w-full h-full rounded-full shadow-2xl overflow-hidden relative"
                      style={{
                        transform: `rotate(${rotation}deg)`,
                        transition: isSpinning ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
                      }}
                    >
                      {rewards.map((reward, index) => (
                        <div
                          key={reward.id}
                          className="absolute w-full h-full"
                          style={{
                            transform: `rotate(${index * segmentAngle}deg)`,
                            clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.tan((segmentAngle * Math.PI) / 360)}% 0%)`,
                          }}
                        >
                          <div
                            className="w-full h-full flex items-start justify-center pt-4"
                            style={{ backgroundColor: reward.color }}
                          >
                            <span
                              className="text-white text-xs font-bold text-center px-1 max-w-[80px] leading-tight"
                              style={{ transform: `rotate(${segmentAngle / 2}deg)` }}
                            >
                              {reward.name}
                            </span>
                          </div>
                        </div>
                      ))}
                      {/* Center circle */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-card shadow-lg flex items-center justify-center">
                        <Star className="w-8 h-8 text-primary" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Panel */}
                <div className="space-y-6">
                  {!user ? (
                    <div className="bg-card rounded-xl p-6 shadow-card text-center">
                      <AlertCircle className="w-12 h-12 text-warning mx-auto mb-4" />
                      <h3 className="font-bold font-heading text-xl mb-2">Login Required</h3>
                      <p className="text-muted-foreground mb-4">
                        Please login or create an account to spin the wheel.
                      </p>
                      <Link to="/auth?mode=login">
                        <Button>Login Now</Button>
                      </Link>
                    </div>
                  ) : (
                    <>
                      {result && (
                        <div className="bg-card rounded-xl p-6 shadow-card animate-fade-in">
                          <div className="text-center">
                            <Gift className="w-12 h-12 text-primary mx-auto mb-3" />
                            <h3 className="font-bold font-heading text-xl mb-2">
                              {result.reward?.reward_type === "nothing" 
                                ? "Better Luck Next Time!" 
                                : "Congratulations! 🎉"}
                            </h3>
                            {result.reward?.reward_type !== "nothing" && (
                              <p className="text-2xl font-bold text-primary">
                                {result.reward?.name}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="bg-card rounded-xl p-6 shadow-card">
                        <Button
                          onClick={handleSpin}
                          disabled={isSpinning || !canSpin}
                          className="w-full"
                          size="lg"
                        >
                          {isSpinning ? "Spinning..." : canSpin ? "Spin Now!" : "Come Back Tomorrow"}
                        </Button>

                        {!canSpin && (
                          <p className="text-sm text-muted-foreground text-center mt-3 flex items-center justify-center gap-2">
                            <Clock className="w-4 h-4" />
                            You can spin again in 24 hours
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  {/* Rewards Info */}
                  <div className="bg-card rounded-xl p-6 shadow-card">
                    <h3 className="font-bold font-heading mb-4">Possible Rewards</h3>
                    <div className="space-y-2">
                      {rewards.map((reward) => (
                        <div key={reward.id} className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: reward.color }}
                          />
                          <span className="text-sm">{reward.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Wins */}
              {user && userSpins.length > 0 && (
                <div className="mt-12">
                  <h3 className="font-bold font-heading text-xl mb-4">Your Recent Spins</h3>
                  <div className="bg-card rounded-xl shadow-card overflow-hidden">
                    <div className="divide-y divide-border">
                      {userSpins.map((spin) => (
                        <div key={spin.id} className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: spin.reward?.color || "#ccc" }}
                            >
                              <Gift className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="font-medium">{spin.reward?.name || "Unknown"}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(spin.spun_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {spin.reward?.reward_type !== "nothing" && (
                            <span className="text-primary font-semibold">
                              +{spin.reward_value}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Rules */}
        <section className="py-12 bg-muted">
          <div className="container mx-auto max-w-2xl">
            <h2 className="text-2xl font-bold font-heading text-center mb-6">How It Works</h2>
            <div className="bg-card rounded-xl p-6 shadow-card">
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                  <span>Login to your Cashback account</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                  <span>Click the "Spin Now" button to spin the wheel</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                  <span>Win exciting rewards including cashback, coupons, and more!</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
                  <span>You can spin once every 24 hours - come back daily!</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default SpinWinPage;

using Neurons.DQN;

namespace App.Web.DQNM;

public class ActionPerformer
{
    private const int MAX_PERIODS_0BASED = Constants.MAX_PERIODS - 1;
    private const double TIME_RATE = 1.0 / MAX_PERIODS_0BASED;
    private const double EPS = 1e-6;

    public ActionResults Act(PeriodContext ctx)
    {
        var pX = Math.Round(ctx.currentState[0], 1);
        var pY = Math.Round(ctx.currentState[1], 1);
        var oX = Math.Round(ctx.currentState[2], 1);
        var oY = Math.Round(ctx.currentState[3], 1);
        var t = Math.Round(ctx.currentState[4], 1);
        var a = ctx.actionToTake;

        // first state transitions
        if (pX < oX) oX -= 0.1;
        else if (pX > oX) oX += 0.1;
        else if (pY < oY) oY -= 0.1;
        else if (pY > oY) oY += 0.1;

        if (a == 0 && pY > 0) pY -= 0.1;
        else if (a == 1 && pX < 0.9) pX += 0.1;
        else if (a == 2 && pY < 0.9) pY += 0.1;
        else if (a == 3 && pX > 0) pX -= 0.1;

        pX = Math.Round(pX, 1);
        pY = Math.Round(pY, 1);
        oX = Math.Round(oX, 1);
        oY = Math.Round(oY, 1);

        t += TIME_RATE;
        if (Math.Abs(1 - t) < EPS) t = 1.0;

        // then rewards for new states
        var r = 0.0;
        if (Math.Abs(pX - oX) < EPS && Math.Abs(pY - oY) < EPS)
            r = -1;
        else if (t >= 1 - EPS)
            r = 1;

        return new()
        {
            gameOver = r == 1 || r == -1,
            reward = r,
            nextState = [pX, pY, oX, oY, t]
        };
    }
}

/**
 * 
 * ACTIONS: up, right, down, left
 * 
 */
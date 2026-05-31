using Neurons.DQN;

namespace App.Web.DQNM;

public class ActionPerformer
{
    // 0-based
    const int MAX_PERIODS = Constants.MAX_PERIODS - 1;

    readonly double maxR = Math.Sqrt(0.9 * 0.9 * 2);


    public ActionResults Act(PeriodContext ctx)
    {
        var x = ctx.currentState[0];
        var y = ctx.currentState[1];
        var a = ctx.actionToTake;

        if (a == 0 && y > 0) y -= 0.1;
        else if (a == 1 && x < 0.9) x += 0.1;
        else if (a == 2 && y < 0.9) y += 0.1;
        else if (a == 3 && x > 0) x -= 0.1;

        var r = Math.Sqrt(x * x + y * y) / maxR;

        return new()
        {
            gameOver = x == 0.9 && y == 0.9,
            reward = r,
            nextState = [x, y]
        };
    }
}

/**
 * 
 * ACTIONS: up, right, down, left
 * 
 */
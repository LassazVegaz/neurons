using Neurons.DQN;

namespace App.Web.DQNM;

public class ActionPerformer
{
    public ActionResults Act(PeriodContext ctx)
    {
        var x = Math.Round(ctx.currentState[0], 1);
        var y = Math.Round(ctx.currentState[1], 1);
        var a = ctx.actionToTake;

        // + for moving towards the goal
        var r = (a == 1 && x < 0.9) || (a == 2 && y < 0.9)
            ? 0.1 : -0.1;

        if (a == 0 && y > 0) y -= 0.1;
        else if (a == 1 && x < 0.9) x += 0.1;
        else if (a == 2 && y < 0.9) y += 0.1;
        else if (a == 3 && x > 0) x -= 0.1;

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
using Neurons.QLearning;

namespace App.Web.QLearningM;

public class ActionPerformer
{
    readonly double[] rewards = MakeRewards();


    public ActionResults Act(PeriodContext ctx)
    {
        var s = ctx.currentState;
        var a = ctx.actionToTake;
        var nextState = s;

        if (a == 0 && s > 9) nextState -= 10;
        else if (a == 1 && s % 10 != 9) nextState++;
        else if (a == 2 && s < 89) nextState += 10;
        else if (a == 3 && s % 10 != 0) nextState--;

        return new()
        {
            nextState = nextState,
            gameOver = ctx.period == Constants.ALLOWED_STEPS,
            reward = rewards[nextState]
        };
    }


    static double[] MakeRewards()
    {
        var r = new double[Constants.STATES];

        for (var i = 0; i < Constants.STATES; i++)
        {
            var col = (i % 10) + 1;
            var row = (i / 10) + 1;
            r[i] = 10 - Math.Sqrt(Math.Pow(10 - col, 2) + Math.Pow(10 - row, 2));
        }

        return r;
    }
}

/**
 * 
 * ACTIONS: up, right, down, left
 * 
 */
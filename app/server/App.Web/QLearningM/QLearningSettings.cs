namespace App.Web.QLearningM;

public class QLearningSettings
{
    public int Iterations { get; set; }
    public required string QTableFile { get; set; }

    /// <summary>
    /// Maximum number of games that can be sent to the client in one training session
    /// </summary>
    public int MaxGamesToSend { get; set; }
}

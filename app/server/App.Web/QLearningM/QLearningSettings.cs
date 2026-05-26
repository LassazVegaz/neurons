namespace App.Web.QLearningM;

public class QLearningSettings
{
    public int Iterations { get; set; }
    public double Lambda { get; set; }
    public required string QTableFile { get; set; }
}

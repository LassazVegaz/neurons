namespace App.Web;

public record AppSettings
{
    /// <summary>
    /// Maximum number of MSEs that can be sent to the clients
    /// </summary>
    public int MaxMsesToSend { get; set; }
    /// <summary>
    /// Send MSEs at this much of intervals of iterations
    /// </summary>
    public int MsesSendingInterval { get; set; }
    public required string ModelFileName { get; set; }
    public required string DataFileName { get; set; }
    public required int TrainingDataCount { get; set; }
}

namespace App.Web.DQNM;

public class DQNSettings
{
    public const string KEY = "DQNSettings";

    public int MaxGamesToSend { get; set; }
    public required string ModelFile { get; set; }
    public required string LastUsedParamsFile { get; set; }
    public int ReplayBufferSize { get; set; }
    public int NetworksSyncPeriod { get; set; }
}
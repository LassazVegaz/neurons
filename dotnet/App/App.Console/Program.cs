var a = new double[2][];

foreach (var b in a) Console.WriteLine(b);

double GetStandardDeviation(double[] numbers)
{
    var avg = numbers.Average();
    var sum = numbers.Sum(d => Math.Pow(d - avg, 2));
    return Math.Sqrt(sum / numbers.Length);
}
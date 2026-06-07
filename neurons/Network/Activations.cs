namespace Neurons.Network;

internal static class Activations
{
    public static double RelU(double x) => x > 0 ? x : 0;
}

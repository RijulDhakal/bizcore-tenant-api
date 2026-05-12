using System;
using BCrypt.Net;

Console.WriteLine($"Hash for 'admin123': {BCrypt.Net.BCrypt.HashPassword("admin123")}");
